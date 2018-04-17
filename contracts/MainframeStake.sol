pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./StakeInterface.sol";

contract MainframeStake is Ownable, StakeInterface {
  using SafeMath for uint256;
  uint256 public totalDepositBalance;
  mapping (address => uint256) public balances;
  ERC20 token;

  uint256 public requiredStake;

  struct Staker {
    uint256 stakedAmount;
    address stakerAddress;
  }

  mapping (address => Staker) public whitelist; // map of whitelisted addresses for efficient hasStaked check

  function MainframeStake(address tokenAddress) public {
    token = ERC20(tokenAddress);
    requiredStake = 1 ether; // ether = 10^18
  }

  function stake(address whitelistAddress) external returns (bool success) {
    require(whitelist[whitelistAddress].stakerAddress == 0x0);

    whitelist[whitelistAddress].stakerAddress = msg.sender;
    whitelist[whitelistAddress].stakedAmount = requiredStake;

    deposit(msg.sender, requiredStake);
    emit Staked(msg.sender);
    return true;
  }

  function unstake(address whitelistAddress) external {
    require(whitelist[whitelistAddress].stakerAddress == msg.sender);

    uint256 stakedAmount = whitelist[whitelistAddress].stakedAmount;
    delete whitelist[whitelistAddress];

    withdraw(msg.sender, stakedAmount);
    emit Unstaked(msg.sender);
  }

  function deposit(address _address, uint256 depositAmount) private returns (bool success) {
    token.transferFrom(_address, this, depositAmount);
    balances[_address] = balances[_address].add(depositAmount);
    totalDepositBalance = totalDepositBalance.add(depositAmount);
    emit Deposit(_address, depositAmount, balances[_address]);
    return true;
  }

  function withdraw(address _address, uint256 withdrawAmount) private returns (bool success) {
    require(balances[_address] >= withdrawAmount);
    token.transfer(_address, withdrawAmount);
    balances[_address] = balances[_address].sub(withdrawAmount);
    totalDepositBalance = totalDepositBalance.sub(withdrawAmount);
    emit Withdrawal(_address, withdrawAmount, balances[_address]);
    return true;
  }

  function balanceOf(address _address) external view returns (uint256 balance) {
    return balances[_address];
  }

  function totalStaked() external view returns (uint256) {
    return totalDepositBalance;
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

  function refundBalances(address[] addresses) public onlyOwner {
    for (uint256 i = 0; i < addresses.length; i++) {
      address _address = addresses[i];
      require(balances[_address] > 0);
      token.transfer(_address, balances[_address]);
      totalDepositBalance = totalDepositBalance.sub(balances[_address]);
      emit RefundedBalance(_address, balances[_address]);
      balances[_address] = 0;
    }
  }

  function emergencyERC20Drain(ERC20 _token) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    uint256 drainAmount;
    if (address(_token) == address(token)) {
      drainAmount = _token.balanceOf(this).sub(totalDepositBalance);
    } else {
      drainAmount = _token.balanceOf(this);
    }
    _token.transfer(owner, drainAmount);
  }

  function destroy() external onlyOwner {
    require(token.balanceOf(this) == 0);
    selfdestruct(owner);
  }

  event Staked(address indexed owner);
  event Unstaked(address indexed owner);
  event Deposit(address indexed _address, uint256 depositAmount, uint256 balance);
  event Withdrawal(address indexed _address, uint256 withdrawAmount, uint256 balance);
  event RefundedBalance(address indexed _address, uint256 refundAmount);
}
