pragma solidity ^0.4.18;

contract StakeInterface {
  function hasStake(address _address) external view returns (bool);
}
