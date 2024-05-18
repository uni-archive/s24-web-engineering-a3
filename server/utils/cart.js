/**
 * This class represents the cart for one session
 */
const {calculatePrice} = require("./price");

class Cart {
  items = new Map();

  /**
   * Get all items in the cart
   * @return {any[]} The items as an array
   */
  getItems() {
    return [...this.items.values()];
  }

  addItem(item) {
    const cartItemId = Math.floor(Math.random() * 1e9);
    const {artworkId, printSize, frameStyle, frameWidth, matWidth, matColor} = item;
    this.items.set(cartItemId, {
      cartItemId,
      price: calculatePrice(printSize, frameStyle, frameWidth, matWidth),
      artworkId,
      printSize,
      frameStyle,
      frameWidth,
      matWidth,
      matColor
    });
  }

  clear() {
    this.items.clear();
  }


  itemIsValid(item) {
      const {artworkId, printSize, frameStyle, frameWidth, matWidth, matColor} = item;
      // validate all items and return error messages like this:
    // {
    //     "message": "Validation failed",
    //     "errors": {
    //       "printSize": "missing",
    //       "matWidth": "invalid",
    //       "frameStyle": "invalid"
    //     }
    //   }
    // or return false if all items are valid

    return true;
  }

  /** TODO: Add other methods to operate on Cart */
}

module.exports = Cart;
