pragma solidity ^0.4.18;

import "./MainframeEscrow.sol";

contract MainframeStake is Ownable {
  using SafeMath for uint256;
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

  function MainframeStake(address escrowAddress) public {
    escrow = MainframeEscrow(escrowAddress);
    requiredStake = 1 ether; // ether = 10^18
    owner = msg.sender;
  }

  function depositAndWhitelist(uint256 value, address whitelistAddress) external returns (bool success) {
    require(value == requiredStake);
    require(whitelist[whitelistAddress].owner == 0x0);

    stakers[msg.sender].balance = stakers[msg.sender].balance.add(value);
    stakers[msg.sender].addresses.push(whitelistAddress);
    whitelist[whitelistAddress].owner = msg.sender;
    whitelist[whitelistAddress].stake = value;

    escrow.deposit(msg.sender, value);
    Whitelisted(msg.sender);
    return true;
  }

  function withdrawFullBalance() external returns (bool success) {
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

  function unwhitelistAddress(address whitelistAddress) external {
    require(whitelist[whitelistAddress].owner == msg.sender);

    uint256 whitelistLength = stakers[msg.sender].addresses.length;
    uint indexToDelete;
    for (uint i = 0; i < whitelistLength; i++) {
      if (stakers[msg.sender].addresses[i] == whitelistAddress) {
        indexToDelete = i;
      }
    }

    uint256 stake = whitelist[whitelistAddress].stake;
    stakers[msg.sender].balance = stakers[msg.sender].balance.sub(stake);

    // Mutating array by moving last item to deleted item location
    // Inspired by https://medium.com/@robhitchens/solidity-crud-part-2-ed8d8b4f74ec
    address lastItem = stakers[msg.sender].addresses[whitelistLength - 1];
    stakers[msg.sender].addresses[indexToDelete] = lastItem;
    stakers[msg.sender].addresses.length --;
    delete whitelist[whitelistAddress];

    escrow.withdraw(msg.sender, stake);
    Unlisted(msg.sender);
  }

  function balanceOf(address owner) external view returns (uint256 balance) {
    return stakers[owner].balance;
  }

  function totalStaked() external view returns (uint256) {
    return escrow.totalBalance();
  }

  function hasStake(address whitelistAddress) external view returns (bool) {
    return whitelist[whitelistAddress].stake > 0;
  }

  function requiredStake() external view returns (uint256) {
    return requiredStake;
  }

  function setRequiredStake(uint256 value) external {
    require(msg.sender == owner);
    requiredStake = value;
  }

  function getEscrowAddress() public view returns (address) {
    return address(escrow);
  }

  function emergencyERC20Drain(ERC20 token, uint amount) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    token.transfer(owner, amount);
  }

  function destroy() external onlyOwner {
    selfdestruct(owner);
  }

  event Whitelisted(address indexed owner);
  event Unlisted(address indexed owner);
}
