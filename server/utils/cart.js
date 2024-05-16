/**
 * This class represents the cart for one session
 */
class Cart {
  items = new Map();

  /**
   * Get all items in the cart
   * @return {any[]} The items as an array
   */
  getItems() {
    return [...this.items.values()];
  }

  /** TODO: Add other methods to operate on Cart */
}

module.exports = Cart;
