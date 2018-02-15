pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MainframeToken {
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function transfer(address to, uint256 value) public returns (bool);
  function balanceOf(address who) public view returns (uint256);
}

contract MainframeStake is Ownable {
  MainframeToken token;
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

  function MainframeStake(address _tokenAddress) public {
    token = MainframeToken(_tokenAddress);
    requiredStake = 1;
    owner = msg.sender;
  }

  function depositAndWhitelist(uint256 _value, address whitelistAddress) public returns (bool success) {
    require(_value == requiredStake);
    require(whitelist[whitelistAddress].owner == 0x0);

    stakers[msg.sender].balance += _value;
    stakers[msg.sender].addresses.push(whitelistAddress);
    whitelist[whitelistAddress].owner = msg.sender;
    whitelist[whitelistAddress].stake = _value;

    token.transferFrom(msg.sender, this, _value);
    Deposit(msg.sender, _value, stakers[msg.sender].balance);
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

    // Transfer tokens back to sender and clear balance
    uint256 balance = stakers[msg.sender].balance;
    stakers[msg.sender].balance = 0;
    token.transfer(msg.sender, balance);
    Withdrawal(msg.sender, balance, 0);
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

    token.transfer(msg.sender, stake);
    Withdrawal(msg.sender, stake, stakers[msg.sender].balance);
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return stakers[_owner].balance;
  }

  function totalStaked() public view returns (uint256) {
    return token.balanceOf(address(this));
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

  event Deposit(address indexed _owner, uint256 _value, uint256 _balance);
  event Withdrawal(address indexed _owner, uint256 _value, uint256 _balance);
}
