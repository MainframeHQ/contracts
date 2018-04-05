pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract MainframeToken {
  function transferFrom(address from, address to, uint256 value) public returns (bool);
}

contract MainframeTokenDistribution is Ownable {

  uint public totalDistributed;
  MainframeToken token;

  event TokensDistributed(address receiver, uint amount);

  function MainframeTokenDistribution(address tokenAddress) {
    token = MainframeToken(tokenAddress);
  }

  function distributeTokens(address tokenOwner, address[] recipients, uint[] amounts) onlyOwner external {
    for( uint i = 0 ; i < recipients.length ; i++ ) {
      if( amounts[i] > 0 ) {
        assert( token.transferFrom( tokenOwner, recipients[i], amounts[i] ) );
        TokensDistributed( recipients[i], amounts[i] );
      }
      totalDistributed += amounts[i];
    }
  }
}
