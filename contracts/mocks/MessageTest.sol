pragma solidity ^0.4.11;

contract MessageTest {

  event ShowMessage(string message);

  function showMessage(string message) public returns (bool) {
    ShowMessage(message);
    return true;
  }
}
