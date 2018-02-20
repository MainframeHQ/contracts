pragma solidity ^0.4.18;

import "./MainframeEscrow.sol";

contract MainframeStake is Ownable {
  MainframeEscrow escrow;

  uint256 public requiredStake;

  struct Staker {
    uint256 balance;
    address[] addresses; // stakers whitelisted addresses as array to allow for iteration in withdrawFullBalance()
  }

  struct WhitelistOwner {
    uint256 stake;
    address owner;
  }

  mapping (address => Staker) public stakers; // maintains balance and addresses of stakers
  mapping (address => WhitelistOwner) public whitelist; // map of whitelisted addresses for efficient hasStaked check

  function MainframeStake(address _escrowAddress) public {
    escrow = MainframeEscrow(_escrowAddress);
    requiredStake = 1 ether; // ether = 10^18
    owner = msg.sender;
  }

  function depositAndWhitelist(uint256 _value, address whitelistAddress) public returns (bool success) {
    require(_value == requiredStake);
    require(whitelist[whitelistAddress].owner == 0x0);

    stakers[msg.sender].balance += _value;
    stakers[msg.sender].addresses.push(whitelistAddress);
    whitelist[whitelistAddress].owner = msg.sender;
    whitelist[whitelistAddress].stake = _value;

    escrow.deposit(msg.sender, _value);
    Whitelisted(msg.sender);
    return true;
  }

  function withdrawFullBalance() public returns (bool success) {
    require(stakers[msg.sender].balance > 0);

    // Remove the whitelisted addresses
    uint256 whitelistLength = stakers[msg.sender].addresses.length;
    for (uint i=0; i< whitelistLength; i++) {
      address whitelistAddress = stakers[msg.sender].addresses[i];
      delete whitelist[whitelistAddress];
    }
    delete stakers[msg.sender].addresses;

    // Transfer stakes back to sender and clear balance
    uint256 balance = stakers[msg.sender].balance;
    stakers[msg.sender].balance = 0;
    escrow.withdraw(msg.sender, balance);
    Unlisted(msg.sender);
    return true;
  }

  function unwhitelistAddress(address _address) public {
    require(whitelist[_address].owner == msg.sender);

    uint256 whitelistLength = stakers[msg.sender].addresses.length;
    uint indexToDelete;
    for (uint i = 0; i < whitelistLength; i++) {
      if (stakers[msg.sender].addresses[i] == _address) {
        indexToDelete = i;
      }
    }

    uint256 stake = whitelist[_address].stake;
    stakers[msg.sender].balance -= stake;

    // Mutating array by moving last item to deleted item location
    // Inspired by https://medium.com/@robhitchens/solidity-crud-part-2-ed8d8b4f74ec
    address lastItem = stakers[msg.sender].addresses[whitelistLength - 1];
    stakers[msg.sender].addresses[indexToDelete] = lastItem;
    stakers[msg.sender].addresses.length --;
    delete whitelist[_address];

    escrow.withdraw(msg.sender, stake);
    Unlisted(msg.sender);
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return stakers[_owner].balance;
  }

  function totalStaked() public view returns (uint256) {
    return escrow.totalBalance();
  }

  function hasStake(address _address) public view returns (bool) {
    return whitelist[_address].stake > 0;
  }

  function requiredStake() public view returns (uint256) {
    return requiredStake;
  }

  function setRequiredStake(uint256 _value) public {
    require(msg.sender == owner);
    requiredStake = _value;
  }

  event Whitelisted(address indexed _owner);
  event Unlisted(address indexed _owner);
}
