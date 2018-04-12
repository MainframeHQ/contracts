pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MainframeEscrow is Ownable {
  using SafeMath for uint256;
  address public stakingAddress;
  uint256 public totalDepositBalance;
  mapping (address => uint256) public balances;
  ERC20 token;

  function MainframeEscrow(address tokenAddress) public {
    token = ERC20(tokenAddress);
    owner = msg.sender;
  }

  function deposit(address _address, uint256 depositAmount) external onlyStakingAddress returns (bool success) {
    token.transferFrom(_address, this, depositAmount);
    balances[_address] = balances[_address].add(depositAmount);
    totalDepositBalance = totalDepositBalance.add(depositAmount);
    Deposit(_address, depositAmount, balances[_address]);
    return true;
  }

  function withdraw(address _address, uint256 withdrawAmount) external onlyStakingAddress returns (bool success) {
    require(balances[_address] >= withdrawAmount);
    token.transfer(_address, withdrawAmount);
    balances[_address] = balances[_address].sub(withdrawAmount);
    totalDepositBalance = totalDepositBalance.sub(withdrawAmount);
    Withdrawal(_address, withdrawAmount, balances[_address]);
    return true;
  }

  function balanceOf(address _address) external view returns (uint256 balance) {
    return balances[_address];
  }

  modifier onlyStakingAddress() {
    require(msg.sender == stakingAddress);
    _;
  }

  function changeStakingAddress(address newStakingAddress) public onlyOwner {
    require(newStakingAddress != address(0));
    StakingAddressChanged(stakingAddress, newStakingAddress);
    stakingAddress = newStakingAddress;
  }

  function refundBalances(address[] addresses) public onlyOwner {
    for (uint256 i = 0; i < addresses.length; i++) {
      address _address = addresses[i];
      require(balances[_address] > 0);
      token.transfer(_address, balances[_address]);
      totalDepositBalance = totalDepositBalance.sub(balances[_address]);
      RefundedBalance(_address, balances[_address]);
      balances[_address] = 0;
    }
  }

  function emergencyERC20Drain(ERC20 tokenToDrain) public onlyOwner {
    // owner can drain tokens that are sent here by mistake
    uint256 drainAmount;
    if (address(tokenToDrain) == address(token)) {
      drainAmount = tokenToDrain.balanceOf(this) - totalDepositBalance;
    } else {
      drainAmount = tokenToDrain.balanceOf(this);
    }
    tokenToDrain.transfer(owner, drainAmount);
  }

  function destroy() external onlyOwner {
    require(token.balanceOf(this) == 0);
    selfdestruct(owner);
  }

  event Deposit(address indexed _address, uint256 depositAmount, uint256 balance);
  event Withdrawal(address indexed _address, uint256 withdrawAmount, uint256 balance);
  event RefundedBalance(address indexed _address, uint256 refundAmount);
  event StakingAddressChanged(address indexed previousStakingAddress, address indexed newStakingAddress);
}
