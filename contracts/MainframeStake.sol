pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract MainframeToken {
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function transfer(address to, uint256 value) public returns (bool);
  function balanceOf(address who) public view returns (uint256);
}

contract MainframeStake is Ownable {
  mapping (address => uint256) public balances;
  MainframeToken token;
  uint256 public maxDeposit;

  function MainframeStake(address _tokenAddress) public {
    token = MainframeToken(_tokenAddress);
    maxDeposit = 100;
    owner = msg.sender;
  }

  function deposit(uint256 _value) public returns (bool success) {
    require(balances[msg.sender] + _value <= maxDeposit);
    token.transferFrom(msg.sender, this, _value);
    balances[msg.sender] += _value;
    Deposit(msg.sender, _value, balances[msg.sender]);
    return true;
  }

  function withdraw(uint256 _value) public returns (bool success) {
    require(balances[msg.sender] >= _value);
    token.transfer(msg.sender, _value);
    balances[msg.sender] -= _value;
    Withdrawal(msg.sender, _value, balances[msg.sender]);
    return true;
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function tokenBalanceOf(address _owner) public view returns (uint256 balance) {
    return token.balanceOf(_owner);
  }

  function totalStaked() public view returns (uint256) {
    return token.balanceOf(address(this));
  }

  function hasStake(address _address) public view returns (bool) {
    return balances[_address] > 0;
  }

  function maxDeposit() public view returns (uint256) {
    return maxDeposit;
  }

  function setMaxDeposit(uint256 _value) public {
    require(msg.sender == owner);
    maxDeposit = _value;
  }

  event Deposit(address indexed _owner, uint256 _value, uint256 _balance);
  event Withdrawal(address indexed _owner, uint256 _value, uint256 _balance);
}
