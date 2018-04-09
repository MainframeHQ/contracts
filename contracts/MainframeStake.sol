pragma solidity ^0.4.18;

import "./MainframeEscrow.sol";
import "./StakeInterface.sol";

contract MainframeStake is Ownable, StakeInterface {
  using SafeMath for uint256;
  MainframeEscrow escrow;

  uint256 public requiredStake;

  struct WhitelistOwner {
    uint256 stake;
    address owner;
  }

  mapping (address => WhitelistOwner) public whitelist; // map of whitelisted addresses for efficient hasStaked check

  function MainframeStake(address escrowAddress) public {
    escrow = MainframeEscrow(escrowAddress);
    requiredStake = 1 ether; // ether = 10^18
  }

  function depositAndWhitelist(uint256 value, address whitelistAddress) external returns (bool success) {
    require(value == requiredStake);
    require(whitelist[whitelistAddress].owner == 0x0);

    whitelist[whitelistAddress].owner = msg.sender;
    whitelist[whitelistAddress].stake = value;

    escrow.deposit(msg.sender, value);
    Whitelisted(msg.sender);
    return true;
  }

  function unwhitelistAddress(address whitelistAddress) external {
    require(whitelist[whitelistAddress].owner == msg.sender);

    uint256 stake = whitelist[whitelistAddress].stake;
    delete whitelist[whitelistAddress];

    escrow.withdraw(msg.sender, stake);
    Unlisted(msg.sender);
  }

  function balanceOf(address owner) external view returns (uint256 balance) {
    return escrow.balanceOf(owner);
  }

  function totalStaked() external view returns (uint256) {
    return escrow.totalDepositBalance();
  }

  function hasStake(address _address) external view returns (bool) {
    return whitelist[_address].stake > 0;
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

  function emergencyERC20Drain(ERC20 token) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    uint256 amount = token.balanceOf(this);
    token.transfer(owner, amount);
  }

  function destroy() external onlyOwner {
    selfdestruct(owner);
  }

  event Whitelisted(address indexed owner);
  event Unlisted(address indexed owner);
}
