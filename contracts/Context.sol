/**
* @dev Provides information about the current execution context, including the
* sender of the transaction and its data. While these are generally available
* via msg.sender and msg.data, they should not be accessed in such a direct
* manner, since when dealing with meta-transactions the account sending the
* transaction is not necessarily the one paying for it. This contract makes
* sure that only legitimate handlers can send meta-transactions through it.
*/
abstract contract Context {
   function _msgSender() internal view virtual returns (address) {
       return msg.sender;
   }

   function _msgData() internal view virtual returns (bytes calldata) {
       return msg.data;
   }
}
