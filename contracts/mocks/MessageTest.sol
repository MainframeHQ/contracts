pragma solidity ^0.4.21;

contract MessageTest {

  event ShowMessage(string message);

  function showMessage(string message) public returns (bool) {
    emit ShowMessage(message);
    return true;
  }
}
