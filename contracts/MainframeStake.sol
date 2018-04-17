pragma solidity ^0.4.21;

import "./MainframeEscrow.sol";
import "./StakeInterface.sol";

contract MainframeStake is Ownable, StakeInterface {
  using SafeMath for uint256;
  MainframeEscrow escrow;

  uint256 public requiredStake;

  struct Staker {
    uint256 stakedAmount;
    address stakerAddress;
  }

  mapping (address => Staker) public whitelist; // map of whitelisted addresses for efficient hasStaked check

  function MainframeStake(address escrowAddress) public {
    escrow = MainframeEscrow(escrowAddress);
    requiredStake = 1 ether; // ether = 10^18
  }

  function stake(address whitelistAddress) external returns (bool success) {
    require(whitelist[whitelistAddress].stakerAddress == 0x0);

    whitelist[whitelistAddress].stakerAddress = msg.sender;
    whitelist[whitelistAddress].stakedAmount = requiredStake;

    escrow.deposit(msg.sender, requiredStake);
    emit Staked(msg.sender);
    return true;
  }

  function unstake(address whitelistAddress) external {
    require(whitelist[whitelistAddress].stakerAddress == msg.sender);

    uint256 stakedAmount = whitelist[whitelistAddress].stakedAmount;
    delete whitelist[whitelistAddress];

    escrow.withdraw(msg.sender, stakedAmount);
    emit Unstaked(msg.sender);
  }

  function balanceOf(address owner) external view returns (uint256 balance) {
    return escrow.balanceOf(owner);
  }

  function totalStaked() external view returns (uint256) {
    return escrow.totalDepositBalance();
  }

  function hasStake(address _address) external view returns (bool) {
    return whitelist[_address].stakedAmount > 0;
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

  event Staked(address indexed owner);
  event Unstaked(address indexed owner);
}
