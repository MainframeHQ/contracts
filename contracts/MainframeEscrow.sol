pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract MainframeToken {
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function transfer(address to, uint256 value) public returns (bool);
  function balanceOf(address who) public view returns (uint256);
}

contract MainframeEscrow is Ownable {
  using SafeMath for uint256;
  address public stakingAddress;
  mapping (address => uint256) public balances;
  MainframeToken token;

  function MainframeEscrow(address tokenAddress) public {
    token = MainframeToken(tokenAddress);
    owner = msg.sender;
    stakingAddress = msg.sender;
  }

  function deposit(address _address, uint256 depositAmount) external onlyStakingAddress returns (bool success) {
    token.transferFrom(_address, this, depositAmount);
    balances[_address] = balances[_address].add(depositAmount);
    return true;
  }

  function withdraw(address _address, uint256 withdrawAmount) external onlyStakingAddress returns (bool success) {
    require(balances[_address] >= withdrawAmount);
    token.transfer(_address, withdrawAmount);
    balances[_address] = balances[_address].sub(withdrawAmount);
    return true;
  }

  function balanceOf(address _address) external view returns (uint256 balance) {
    return balances[_address];
  }

  function totalBalance() external view returns (uint256) {
    return token.balanceOf(this);
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

  event StakingAddressChanged(address indexed previousStakingAddress, address indexed newStakingAddress);
}
