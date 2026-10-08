/* App-wide translations for MVP Marketplace.
 *
 * `en` is the source of truth: every other dictionary is a partial override
 * and any key it omits falls back to English, then to a caller-supplied
 * default, then to the key itself. English is also the default LOCALE when a
 * visitor has expressed no preference, so every existing English assertion in
 * the app stays valid.
 *
 * Resolution order for the active locale:
 *   1. an explicit `?lang=<tag>` in the URL (a display override, not saved)
 *   2. the saved in-app choice (`store.prefs.locale`, persisted under the
 *      `bazario:` prefix and mirrored to the signed-in user's profile)
 *   3. the platform user language (`usernode.getUserLocale()` / the iframe
 *      token's `locale` claim)
 *   4. the device language (`navigator.language`)
 *   5. English
 *
 * A missing key logs a development warning once per key (never a console
 * error, so the platform's "no console errors" check is unaffected).
 *
 * Adding a language: copy the `en` object below, translate the values, add it
 * to DICTS with its BCP-47 tag, and list the tag in COMPLETE_LOCALES once
 * every key is translated. See public/js/i18n/README.md for the short guide.
 */

import { store } from './store.js';

/* Locales that ship a complete dictionary. Only these are offered in the
 * Settings picker; a partial locale can still be forced with `?lang=`. */
export const COMPLETE_LOCALES = ['en', 'es'];

/* Every shipped dictionary, complete or partial. */
export const SHIPPED_LOCALES = ['en', 'es', 'pt-BR', 'id'];

/* Endonyms, shown untranslated in the picker. */
export const LOCALE_NAMES = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  id: 'Bahasa Indonesia',
};

const EN = {
  /* ---- shared building blocks ---- */
  'common.cancel': 'Cancel',
  'common.remove': 'Remove',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.apply': 'Apply',
  'common.reset': 'Reset',
  'common.default': 'Default',
  'common.saved': 'Saved',
  'common.free': 'Free',
  'common.clearAll': 'Clear all',
  'common.loadMore': 'Load more',
  'common.selectedOf': '{selected} of {total} selected',

  /* ---- counts / plurals ---- */
  'count.products.one': '{n} product',
  'count.products.other': '{n} products',
  'count.items.one': '{n} item',
  'count.items.other': '{n} items',
  'count.sold': '{n} sold',
  'count.followers': '{n} followers',
  'count.reviewsParen': '({n} reviews)',
  'count.reviews': '{n} reviews',
  'count.remaining': '{n}',
  'count.moreItems': '+{n} more item',
  'count.moreItemsPlural': '+{n} more items',
  'review.3_days_ago': '3 days ago',
  'review.1_week_ago': '1 week ago',
  'review.2_weeks_ago': '2 weeks ago',
  'review.2_weeks_ago': '2 weeks ago',
  'review.3_weeks_ago': '3 weeks ago',
  'review.1_month_ago': '1 month ago',
  'review.2_months_ago': '2 months ago',
  'review.3_months_ago': '3 months ago',

  /* ---- accessibility labels ---- */
  'aria.home': 'MVP Marketplace home',
  'aria.primaryNav': 'Primary',
  'aria.colorTheme': 'Color theme',
  'aria.notifications': 'Notifications',
  'aria.cart': 'Cart',
  'aria.promotions': 'Promotions',
  'aria.categories': 'Categories',
  'aria.flashSale': 'Flash Sale',
  'aria.recommended': 'Recommended products',
  'aria.results': 'Results',
  'aria.scrollLeft': 'Scroll left',
  'aria.scrollRight': 'Scroll right',
  'aria.backToHome': 'Back to home',
  'aria.filters': 'Filters',
  'aria.closeFilters': 'Close filters',
  'aria.goToBanner': 'Go to banner {n}',
  'aria.back': 'Back',
  'aria.toggleFavorite': 'Toggle favorite',
  'aria.addToCart': 'Add to cart',
  'aria.soldOut': 'Sold out',
  'aria.decreaseQty': 'Decrease quantity',
  'aria.increaseQty': 'Increase quantity',
  'aria.saveForLater': 'Save for later',
  'aria.removeSavedItem': 'Remove saved item',
  'aria.removeFromCart': 'Remove from cart',
  'aria.selectProduct': 'Select {name}',
  'aria.selectAllItems': 'Select all items',
  'aria.removeVoucher': 'Remove voucher',
  'aria.voucherCode': 'Voucher code',
  'aria.colorOption': 'Color {name}',
  'aria.removeFilter': 'Remove filter {title}',
  'aria.removeCity': 'Remove {city}',
  'aria.filterByLocation': 'Filter by location',
  'aria.minPrice': 'Minimum price',
  'aria.maxPrice': 'Maximum price',
  'aria.sortBy': 'Sort by',
  'aria.orderStatus': 'Order status',
  'aria.copyOrderNumber': 'Copy order number',
  'aria.copyTracking': 'Copy tracking number',
  'aria.close': 'Close',
  'aria.prevPhoto': 'Previous photo',
  'aria.nextPhoto': 'Next photo',
  'aria.photoOf': 'Photo {i} of {n}',
  'aria.showPhotoOf': 'Show photo {i} of {n}',
  'aria.changeProfilePhoto': 'Change profile photo',
  'aria.removeItem': 'Remove {name}',
  'aria.deleteAddress': 'Delete address',
  'aria.zoom': 'Zoom',
  'aria.ratedOutOf': 'Rated {rating} out of {max}',

  /* ---- top nav + brand ---- */
  'nav.home': 'Home',
  'nav.categories': 'Categories',
  'nav.cart': 'Cart',
  'nav.orders': 'Orders',
  'nav.profile': 'Profile',

  /* ---- search ---- */
  'search.placeholder': 'Search products, brands, and more',
  'search.aria': 'Search products',
  'search.title': 'Search',
  'search.recent': 'Recent searches',
  'search.trending': 'Trending searches',
  'search.startTyping': 'Start typing to search.',
  'search.noMatches': 'No matches for "{q}". Press Enter to search anyway.',
  'search.removeRecent': 'Remove {q} from recent searches',
  'search.heroTitle': 'Search MVP Marketplace',
  'search.heroBody': 'Find products across every category. Start with a word, a brand or a category name.',
  'search.popular': 'Popular searches',
  'search.resultsFor': 'Results for "{q}"',
  'search.docTitle': 'Search · MVP Marketplace',

  /* ---- home ---- */
  'home.categories': 'Categories',
  'home.flashSale': 'Flash Sale',
  'home.endsIn': 'Ends in',
  'home.recommended': 'Recommended for you',
  'home.more': 'More',
  'home.bigDeals': 'Big deals',
  'home.limitedTime': 'Limited time',
  'home.noResults': 'No results found',
  'home.noDealsBody': 'No discounted products right now. Try a trending search instead.',
  'home.clearSearch': 'Clear search',
  'home.emptyTitle': 'No products found.',
  'home.emptyBodyFilters': 'Try changing your filters.',
  'home.emptyBody': 'Nothing to show here right now. Try again in a moment.',
  'home.loadFailed': 'Could not load products. Pull to refresh or try again.',

  /* ---- promo banners ---- */
  'banner.deals.title': 'Mega Weekend Sale',
  'banner.deals.body': 'Up to 60% off across every category. Ends Sunday.',
  'banner.deals.cta': 'Shop the deals',
  'banner.flash.title': 'Flash Sale Live Now',
  'banner.flash.body': 'Lightning deals on bestsellers. Gone when the clock hits zero.',
  'banner.flash.cta': 'See flash deals',
  'banner.new.title': 'New Season Arrivals',
  'banner.new.body': 'Fresh fits and fresh tech just dropped in Fashion and Electronics.',
  'banner.new.cta': 'Explore new in',

  /* ---- categories + subcategories ---- */
  'cat.electronics': 'Electronics',
  'cat.fashion': 'Fashion',
  'cat.beauty': 'Beauty',
  'cat.home': 'Home',
  'cat.sports': 'Sports',
  'cat.groceries': 'Groceries',
  'cat.accessories': 'Accessories',
  'sub.audio': 'Audio',
  'sub.phones': 'Phones',
  'sub.computing': 'Computing',
  'sub.cameras': 'Cameras',
  'sub.tv': 'TV & Video',
  'sub.wearables': 'Wearables',
  'sub.smarthome': 'Smart Home',
  'sub.tops': 'Tops',
  'sub.dresses': 'Dresses',
  'sub.outerwear': 'Outerwear',
  'sub.bags': 'Bags',
  'sub.eyewear': 'Eyewear',
  'sub.skincare': 'Skincare',
  'sub.makeup': 'Makeup',
  'sub.furniture': 'Furniture',
  'sub.lighting': 'Lighting',
  'sub.bedding': 'Bedding',
  'sub.decor': 'Decor',
  'sub.fitness': 'Fitness',
  'sub.outdoor': 'Outdoor',
  'sub.teamSports': 'Team Sports',
  'sub.beverages': 'Beverages',
  'sub.pantry': 'Pantry',
  'sub.fresh': 'Fresh Produce',
  'sub.watches': 'Watches',
  'sub.jewelry': 'Jewelry',
  'sub.smallGoods': 'Bags & Wallets',
  'sub.travel': 'Travel',

  /* ---- sellers ---- */
  'seller.badge.official': 'Official store',
  'seller.badge.verified': 'Verified seller',
  'seller.title': 'Seller',
  'seller.followers': '{n} followers',
  'seller.response': '{pct} response rate',
  'seller.since': 'Since {year}',
  'seller.chat': 'Chat seller',
  'seller.chatSoon': 'Seller chat is coming soon',

  /* ---- browse / filters / sort ---- */
  'browse.all': 'All',
  'browse.searchIn': 'Search in {cat}',
  'browse.filter': 'Filter',
  'browse.sort': 'Sort: {label}',
  'browse.price': 'Price',
  'browse.rating': 'Customer rating',
  'browse.brand': 'Brand',
  'browse.discount': 'Discount',
  'browse.availability': 'Availability',
  'browse.inStockOnly': 'In stock only',
  'browse.any': 'Any',
  'browse.priceAny': 'Any price',
  'browse.priceUnder20': 'Under $20',
  'browse.price20to100': '$20 to $100',
  'browse.price100to300': '$100 to $300',
  'browse.priceOver300': '$300 & above',
  'browse.rating45': '4.5 & up',
  'browse.rating40': '4.0 & up',
  'browse.rating35': '3.5 & up',
  'browse.discount10': '10% or more',
  'browse.discount20': '20% or more',
  'browse.discount30': '30% or more',
  'browse.show': 'Show {count}',
  'browse.noResults': 'No results found',
  'browse.noResultsCategoryBody': 'No products match your filters in this category. Try clearing them or searching a different word.',
  'browse.clearFilters': 'Clear search & filters',
  'browse.noResultsSearchBody': 'Nothing matches "{q}" right now. Try a different word, or start from a popular search.',
  'browse.clearSearch': 'Clear search',
  'browse.categoryNotFound': 'Category not found',
  'browse.categoryNotFoundBody': 'That category does not exist. Browse all categories instead.',
  'browse.backToHome': 'Back to home',
  'browse.allCategories': 'All categories',
  'browse.soFar': 'so far',

  'sort.recommended': 'Recommended',
  'sort.popular': 'Popular',
  'sort.newest': 'Newest',
  'sort.priceAsc': 'Price: Low to High',
  'sort.priceDesc': 'Price: High to Low',
  'sort.topRated': 'Top rated',
  'sort.bestSelling': 'Best selling',
  'sort.biggestDiscount': 'Biggest discount',

  'filter.location': 'Location',
  'filter.price': 'Price',
  'filter.sortBy': 'Sort by',
  'filter.allLocations': 'All Locations',
  'filter.searchCities': 'Search cities',
  'filter.cities': 'Cities',
  'filter.noCities': 'No cities match',
  'filter.useMyLocation': 'Use my current location',
  'filter.min': 'Min',
  'filter.max': 'Max',
  'filter.priceHint': 'Enter an amount, then Apply.',
  'filter.priceSwap': 'Minimum is above maximum. They will be swapped when you apply.',
  'filter.locationUnavailable': 'Location services are not available here.',
  'filter.locationDeclined': 'Location permission was declined.',
  'filter.noCityNearby': 'No marketplace city is near you yet.',
  'filter.locationError': 'Could not read your location.',
  'filter.chipPriceRange': 'Price {min} to {max}',
  'filter.chipFrom': 'From {min}',
  'filter.chipFromTitle': 'Price from {min}',
  'filter.chipUpTo': 'Up to {max}',
  'filter.chipUpToTitle': 'Price up to {max}',
  'filter.chipSortTitle': 'Sort: {label}',

  /* ---- cart ---- */
  'cart.title': 'Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptyBody': 'Browse the catalog and add something you like.',
  'cart.startShopping': 'Start shopping',
  'cart.selectAll': 'Select all',
  'cart.deselectAll': 'Deselect all',
  'cart.savedForLater': 'Saved for later',
  'cart.moveToCart': 'Move to cart',
  'cart.lineTotal': 'Line total',
  'cart.vouchers': 'Vouchers',
  'cart.applied': 'Applied',
  'cart.apply': 'Apply',
  'cart.voucherPlaceholder': 'Enter voucher code',
  'cart.voucherUnderMin': 'Your order is under the minimum, so it is not applied yet.',
  'cart.availableVouchers': 'Available vouchers',
  'cart.orderSummary': 'Order summary',
  'cart.subtotal': 'Subtotal ({items})',
  'cart.productDiscounts': 'Product discounts',
  'cart.shipping': 'Shipping',
  'cart.estimatedShipping': 'Estimated shipping',
  'cart.total': 'Total',
  'cart.voucherRow': 'Voucher ({code})',
  'cart.checkout': 'Checkout',
  'cart.checkoutLater': 'Checkout and payment arrive in a later phase.',
  'cart.totalItems': 'Total ({items})',
  'cart.currencyPlaceholder': '-',
  'cart.confirmTitle': 'Remove item?',
  'cart.confirmBody': '{name} will be removed from your cart.',
  'cart.removed': 'Removed from cart',
  'cart.voucherNotValid': '"{code}" is not a valid voucher code. Check the spelling and try again.',
  'cart.voucherEnter': 'Enter a voucher code first.',
  'cart.voucherMin': '"{code}" needs a {min} subtotal. Add {more} more to use it.',
  'cart.voucherApplied': 'Voucher {code} applied',

  /* ---- vouchers (descriptions) ---- */
  'voucher.descPercent': '{value}% off your order',
  'voucher.descFixed': '{value} off your order',
  'voucher.descShip': 'Free shipping on your order',
  'voucher.descMin': 'orders over {min}',

  /* ---- checkout ---- */
  'checkout.title': 'Checkout',
  'checkout.backToCart': 'Back to cart',
  'checkout.emptyTitle': 'Your cart is empty',
  'checkout.emptyBody': 'Add items to your cart to check out.',
  'checkout.continueShopping': 'Continue shopping',
  'checkout.shippingAddress': 'Shipping address',
  'checkout.products': 'Products',
  'checkout.shipping': 'Shipping',
  'checkout.voucher': 'Voucher',
  'checkout.paymentMethod': 'Payment method',
  'checkout.orderSummary': 'Order summary',
  'checkout.subtotal': 'Subtotal',
  'checkout.shippingFee': 'Shipping',
  'checkout.discount': 'Discount',
  'checkout.total': 'Total',
  'checkout.placeOrder': 'Place order',
  'checkout.mockNote': 'Mock checkout: no real payment is taken.',
  'checkout.choosePayment': 'Choose payment method',
  'checkout.changePayment': 'Change payment method',
  'checkout.paymentRequired': 'Choose a payment method to place your order',
  'checkout.destinationCountry': 'Destination country',
  'checkout.courier': 'Courier',
  'checkout.changeAddress': 'Change address',
  'checkout.saveAddress': 'Save address',
  'checkout.voucherPlaceholder': 'Voucher code',
  'checkout.voucherApply': 'Apply',
  'checkout.voucherRemove': 'Remove',
  'checkout.voucherHint': 'Try MVP10 for 10% off your order.',
  'checkout.voucherPct10': '10% off your order',
  'checkout.voucherFlat5': '$5.00 off your order',
  'checkout.voucherEnter': 'Enter a voucher code',
  'checkout.voucherNotValid': 'That code is not valid',
  'checkout.qty': 'Qty {n}',
  'checkout.each': '{price} each',
  'checkout.addressSaved': 'Address saved',
  'checkout.voucherApplied': 'Voucher applied: {label}',
  'checkout.checkFields': 'Check the highlighted fields',
  'checkout.paymentChosen': 'Payment method: {name}',
  'checkout.placing': 'Placing order…',
  'checkout.processing': 'Processing payment…',
  'checkout.successTitle': 'Order placed successfully',
  'checkout.orderNo': 'Order {no}',
  'checkout.estimatedDelivery': 'Estimated delivery',
  'checkout.payment': 'Payment',
  'checkout.viewOrder': 'View order',
  'checkout.fieldName': 'Name',
  'checkout.phName': 'Full name',
  'checkout.fieldPhone': 'Phone',
  'checkout.phPhone': '+1 555 010 2233',
  'checkout.fieldAddress': 'Address',
  'checkout.phAddress': 'Street and house number',
  'checkout.fieldCity': 'City',
  'checkout.phCity': 'City',
  'checkout.fieldPostal': 'Postal code',
  'checkout.phPostal': 'ZIP / postal code',
  'checkout.errName': 'Enter your full name',
  'checkout.errPhone': 'Enter a valid phone number',
  'checkout.errAddress': 'Enter your street address',
  'checkout.errCity': 'Enter your city',
  'checkout.errPostal': 'Enter a valid postal code',
  'checkout.methodCardName': 'Credit / Debit Card',
  'checkout.methodCardDesc': 'Visa, Mastercard, JCB',
  'checkout.methodBankName': 'Bank Transfer',
  'checkout.methodBankDesc': 'Virtual Account',
  'checkout.methodWalletName': 'E-Wallet',
  'checkout.methodWalletDesc': 'DANA, GoPay, OVO',
  'checkout.methodCodName': 'Cash on Delivery',
  'checkout.methodCodDesc': 'Pay the courier on arrival',
  'variant.electronics': 'Black',
  'variant.fashion': 'Medium',
  'variant.beauty': '50 ml',
  'variant.home': 'Standard',
  'variant.sports': 'One size',
  'variant.groceries': '1 pack',
  'variant.accessories': 'Standard',

  /* ---- payment methods ---- */
  'payment.title': 'Payment methods',
  'payment.empty': 'No payment methods saved',
  'payment.emptyBody': 'Add a bank account, e-wallet or card to check out faster next time.',
  'payment.add': 'Add payment method',
  'payment.setDefault': 'Set as default',
  'payment.groupBank': 'Bank Transfer / Virtual Account',
  'payment.groupEwallet': 'E-Wallets',
  'payment.groupCard': 'Cards',
  'payment.groupOther': 'Other',
  'payment.subVirtualAccount': 'Virtual Account',
  'payment.subEwallet': 'E-Wallet',
  'payment.subCard': 'Visa, Mastercard, JCB',
  'payment.subScan': 'Scan to pay',
  'payment.subCod': 'Pay the courier on arrival',
  'payment.subStores': 'Indomaret, Alfamart',
  'payment.nameCard': 'Credit / Debit Card',
  'payment.nameCod': 'Cash on Delivery',
  'payment.nameStores': 'Convenience stores',
  'payment.addAccount': 'Add {name} account',
  'payment.link': 'Link {name}',
  'payment.linkShort': 'Add',
  'payment.addCard': 'Add a card',
  'payment.accountNumber': 'Account number',
  'payment.phAccountNumber': 'Bank account number',
  'payment.accountHolder': 'Account holder name',
  'payment.phAccountHolder': 'Name on the account',
  'payment.phoneNumber': 'Phone number',
  'payment.phPhoneNumber': 'Registered mobile number',
  'payment.cardNumber': 'Card number',
  'payment.phCardNumber': '1234 5678 9012 3456',
  'payment.nameOnCard': 'Name on card',
  'payment.phNameOnCard': 'Name as printed on the card',
  'payment.expiry': 'Expiry',
  'payment.phExpiry': 'MM/YY',
  'payment.cvv': 'CVV',
  'payment.phCvv': '123',
  'payment.cardNote': 'Only the last four digits are saved (•••• 4242). No full card number is stored.',
  'payment.back': 'Back',
  'payment.errPhone': 'Enter a valid mobile number (9 to 15 digits)',
  'payment.errAccount': 'Enter a valid account number (6 to 20 digits)',
  'payment.errHolder': 'Enter the account holder name',
  'payment.errCard': 'Enter a valid card number',
  'payment.errCardHolder': 'Enter the name on the card',
  'payment.errExpiry': 'Use MM/YY',
  'payment.errCvv': 'Enter the 3 or 4 digit code',
  'payment.added': '{name} added',
  'payment.removed': '{name} removed',
  'payment.setDefaultToast': '{name} set as default',
  'payment.defaultToast': 'Method set as default',
  'payment.removeTitle': 'Remove {name}?',
  'payment.removeBody': 'This removes the saved payment method{detail} from your account.',
  'payment.removeDetail': ' ({detail})',

  /* ---- addresses ---- */
  'addr.title': 'Addresses',
  'addr.empty': 'No addresses yet',
  'addr.emptyBody': 'Save a shipping address to use it at checkout.',
  'addr.add': 'Add address',
  'addr.defaultAddress': 'Default address',
  'addr.setDefault': 'Set as default',
  'addr.deleteTitle': 'Delete address?',
  'addr.deleteBody': 'This removes the saved address for {name}.',
  'addr.deleteBodyPlain': 'This removes the saved address.',
  'addr.defaultUpdated': 'Default address updated',
  'addr.deleted': 'Address deleted',
  'addr.saved': 'Address saved',
  'addr.fieldName': 'Full name',
  'addr.fieldPhone': 'Phone',
  'addr.fieldStreet': 'Street address',
  'addr.fieldCity': 'City',
  'addr.fieldZip': 'ZIP code',
  'addr.makeDefault': 'Make this my default address',
  'addr.save': 'Save address',
  'addr.saveChanges': 'Save changes',
  'addr.newTitle': 'New address',
  'addr.editTitle': 'Edit address',

  /* ---- orders ---- */
  'orders.title': 'Orders',
  'orders.emptyAll': 'No orders yet',
  'orders.emptyToPay': 'No orders to pay',
  'orders.emptyToShip': 'No orders to ship',
  'orders.emptyShipped': 'No shipped orders',
  'orders.emptyCompleted': 'No completed orders',
  'orders.emptyCancelled': 'No cancelled orders',
  'orders.emptyBody': 'Orders in this status will show up here as soon as there are any.',
  'orders.tabAll': 'All',
  'orders.tabToPay': 'To Pay',
  'orders.tabToShip': 'To Ship',
  'orders.tabShipped': 'Shipped',
  'orders.tabCompleted': 'Completed',
  'orders.tabCancelled': 'Cancelled',
  'orders.statusToPay': 'To Pay',
  'orders.statusToShip': 'To Ship',
  'orders.statusShipped': 'Shipped',
  'orders.statusCompleted': 'Completed',
  'orders.statusCancelled': 'Cancelled',
  'orders.hintToPay': 'Awaiting payment. This order ships as soon as payment is confirmed.',
  'orders.hintToShip': 'Payment received. We are packing your order for shipment.',
  'orders.hintShipped': 'On the way. Track the delivery below.',
  'orders.hintCompleted': 'Delivered. We hope you are enjoying your order.',
  'orders.hintCancelled': 'This order was cancelled. Any payment is refunded within 3-5 business days.',
  'orders.no': 'No. {no}',
  'orders.orderNo': 'Order {no}',
  'orders.qty': 'Qty {n}',
  'orders.placed': 'Placed {date}',
  'orders.viewDetails': 'View Details',
  'orders.buyAgain': 'Buy Again',
  'orders.detailTitle': 'Order details',
  'orders.timeline': 'Timeline',
  'orders.shipping': 'Shipping address',
  'orders.products': 'Products',
  'orders.paymentMethod': 'Payment method',
  'orders.courier': 'Courier',
  'orders.shipTo': 'Ship to {country} · ',
  'orders.paymentOnDelivery': 'Payment on delivery',
  'orders.priceSummary': 'Price summary',
  'orders.subtotal': 'Subtotal ({items})',
  'orders.productDiscounts': 'Product discounts',
  'orders.shippingFee': 'Shipping',
  'orders.total': 'Total',
  'orders.track': 'Track Order',
  'orders.cancel': 'Cancel Order',
  'orders.contact': 'Contact Seller',
  'orders.stepPlaced': 'Order placed',
  'orders.stepPaid': 'Payment confirmed',
  'orders.stepShipped': 'Shipped',
  'orders.stepDelivered': 'Delivered',
  'orders.stepCancelled': 'Order cancelled',
  'orders.stepPacking': 'Packing your order',
  'orders.hintPacking': 'Usually ships in 1-2 days',
  'orders.hintAwaitingPayment': 'Awaiting payment',
  'orders.hintInTransit': 'In transit',
  'orders.itemsAdded': 'Items added to cart',
  'orders.cancelTitle': 'Cancel order?',
  'orders.cancelBody': 'Order {no} will be cancelled. Any payment is refunded within 3-5 business days.',
  'orders.cancelConfirm': 'Cancel order',
  'orders.cancelled': 'Order cancelled',
  'orders.trackTitle': 'Track order',
  'orders.tracking': 'Tracking {no}',
  'orders.checkpointCreated': 'Label created',
  'orders.checkpointPickedUp': 'Picked up by {courier}',
  'orders.checkpointTransit': 'In transit',
  'orders.checkpointTransitHint': 'Moving through the network',
  'orders.checkpointDelivered': 'Delivered',
  'orders.estimated': 'Estimated {date}',
  'orders.deliveredBy': 'Delivered by {courier}',
  'orders.inTransitWith': 'In transit with {courier}. Arriving soon.',
  'orders.courierFallback': 'the courier',
  'orders.contactTitle': 'Contact seller',
  'orders.contactBody': 'In-app seller messaging arrives in a later phase. Your order number is {no}. Keep it handy when contacting support.',
  'orders.copyOrderNumber': 'Copy order number',
  'orders.copied': 'Copied',

  /* ---- profile ---- */
  'profile.title': 'Profile',
  'profile.guest': 'Guest shopper',
  'profile.signedInVia': 'Signed in via Homeroom',
  'profile.signInHint': 'Sign in through Homeroom to sync your account',
  'profile.editProfile': 'Edit Profile',
  'profile.statOrders': 'Orders',
  'profile.statWishlist': 'Wishlist',
  'profile.statCoupons': 'Coupons',
  'profile.colorTheme': 'Color theme',
  'profile.myOrders': 'My Orders',
  'profile.wishlist': 'Wishlist',
  'profile.addresses': 'Addresses',
  'profile.paymentMethods': 'Payment methods',
  'profile.coupons': 'Coupons',
  'profile.notifications': 'Notifications',
  'profile.helpCenter': 'Help Center',
  'profile.settings': 'Settings',
  'profile.logout': 'Log out',
  'profile.wishlistEmpty': 'Your wishlist is empty',
  'profile.wishlistEmptyBody': 'Tap the heart on any product to save it here for later.',
  'profile.couponsNote': 'Apply a code in your cart before checkout.',
  'profile.useInCart': 'Use in cart',
  'profile.notificationsEmpty': 'You are all caught up',
  'profile.notificationsEmptyBody': 'Order updates and promotions will appear here.',
  'profile.notificationSettings': 'Notification settings',
  'profile.helpQ1': 'Where is my order?',
  'profile.helpA1': 'Open the order from My Orders and check its timeline. Tracking appears once it ships.',
  'profile.helpQ2': 'How long does delivery take?',
  'profile.helpA2': 'Standard delivery takes 3-5 business days. Express arrives in 1-2 business days.',
  'profile.helpQ3': 'Can I cancel an order?',
  'profile.helpA3': 'Yes, while it is To Pay or To Ship. Open the order and tap Cancel Order.',
  'profile.helpQ4': 'How do returns work?',
  'profile.helpA4': 'Returns arrive in a later phase. Use Contact Seller on the order for help meanwhile.',
  'profile.helpQ5': 'Which payment methods can I use?',
  'profile.helpA5': 'Bank transfer and virtual accounts, e-wallets, cards, QRIS and cash on delivery. Manage them under Profile > Payment methods.',
  'profile.logoutTitle': 'Log out?',
  'profile.logoutBody': 'MVP Marketplace keeps your cart, wishlist, addresses and settings on this device. Logging out clears them.',
  'profile.logoutConfirm': 'Log out',
  'profile.loggedOut': 'Logged out',

  /* ---- settings ---- */
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.accountSettings': 'Account settings',
  'settings.notifications': 'Notification settings',
  'settings.orderUpdates': 'Order updates',
  'settings.promotions': 'Promotions and deals',
  'settings.preferences': 'Preferences',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.privacy': 'Privacy',
  'settings.personalized': 'Personalized recommendations',
  'settings.saveSearch': 'Save search history',
  'settings.languagePickerTitle': 'Language',
  'settings.languageSet': 'Language set to {label}',
  'settings.useLanguagePicker': 'Use the language picker in Settings',
  'settings.useSwatches': 'Use the color swatches to change the theme (header on desktop, Profile page on mobile)',
  'settings.editTitle': 'Edit profile',
  'settings.photo': 'Profile photo',
  'settings.photoHint': 'Tap the photo to choose from your gallery or remove it.',
  'settings.change': 'Change',
  'settings.displayName': 'Display name',
  'settings.email': 'Email',
  'settings.phone': 'Phone',
  'settings.saveChanges': 'Save changes',
  'settings.signInNote': 'Your sign-in stays with Homeroom. These details personalize your MVP Marketplace account.',
  'settings.profileSaved': 'Profile saved',

  /* ---- profile photo ---- */
  'photo.invalid': 'Choose a JPG, PNG or WEBP image.',
  'photo.tooLarge': 'That image is too large. Try a smaller one.',
  'photo.failed': 'Could not upload your photo. Try again.',
  'photo.unavailable': 'Photo uploads are not available here.',
  'photo.menuTitle': 'Profile photo',
  'photo.choose': 'Choose from Gallery',
  'photo.remove': 'Remove Photo',
  'photo.removeTitle': 'Remove profile photo?',
  'photo.removeBody': 'Your avatar will go back to the letter placeholder.',
  'photo.removeConfirm': 'Remove Photo',
  'photo.removePhoto': 'Remove Photo',
  'photo.removed': 'Profile photo removed',
  'photo.updated': 'Profile photo updated',
  'photo.addTitle': 'Add photo',
  'photo.zoom': 'Zoom',
  'photo.cancel': 'Cancel',
  'photo.save': 'Save photo',
  'photo.saving': 'Saving…',
  'photo.cropHint': 'Drag to reframe, pinch or use the slider to zoom. The circle shows what your avatar will look like.',
  'photo.noPhoto': 'No photo selected',
  'photo.noPhotoBody': 'Choose an image from your gallery to set a profile photo.',

  /* ---- theme ---- */
  'theme.switchTo': 'Switch to {name} theme',

  /* ---- product detail ---- */
  'product.soldOut': 'Sold out',
  'product.color': 'Color: ',
  'product.size': 'Size: ',
  'product.quantity': 'Quantity',
  'product.freeShipping': 'Free shipping',
  'product.shipping': 'Shipping {fee}',
  'product.arrivesIn': ' · Arrives in {eta}',
  'product.returns': '30-day free returns',
  'product.etaFast': '2-4 business days',
  'product.etaSlow': '3-5 business days',
  'product.description': 'Description',
  'product.reviews': 'Reviews',
  'product.verified': 'Verified purchase',
  'product.youMayLike': 'You may also like',
  'product.recentlyViewed': 'Recently viewed',
  'product.addToCart': 'Add to Cart',
  'product.buyNow': 'Buy Now',
  'product.notFound': 'Product not found',
  'product.notFoundBody': 'That product is no longer available. Explore the catalog for something similar.',
  'product.backToHome': 'Back to home',
  'product.docTitle': '{name} · MVP Marketplace',
  'product.docNotFound': 'Product not found · MVP Marketplace',
  'product.photoAlt': '{name} photo {i}',
  'product.addedToCart': 'Added to cart',

  /* ---- spec labels (kept from the original partial dictionaries) ---- */
  'specifications': 'Specifications',
  'description': 'Description',
  'reviews': 'Reviews',
  'inStock': 'In stock',
  'soldOut': 'Sold out',
  'spec.display': 'Display',
  'spec.processor': 'Processor',
  'spec.ram': 'RAM',
  'spec.storage': 'Storage',
  'spec.graphics': 'Graphics',
  'spec.battery': 'Battery',
  'spec.weight': 'Weight',
  'spec.os': 'Operating System',
  'spec.ports': 'Ports',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Camera',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Size options',
  'spec.fit': 'Fit',
  'spec.care': 'Care instructions',
  'spec.origin': 'Origin',
  'spec.dimensions': 'Dimensions',
  'spec.power': 'Power / Capacity',
  'spec.brand': 'Brand',
  'spec.model': 'Model',
  'spec.sku': 'Product ID',
  'spec.stock': 'Stock',
  'spec.warranty': 'Warranty',

  /* ---- global toasts ---- */
  'toast.addedToFavorites': 'Added to favorites',
  'toast.removedFromFavorites': 'Removed from favorites',
  'toast.soldOut': 'This item is sold out',
  'toast.comingSoon': 'Coming in a later phase',
  'toast.savedForLater': 'Saved for later',
  'toast.movedToCart': 'Moved to cart',
  'toast.removedFromSaved': 'Removed from saved items',
  'toast.voucherRemoved': 'Voucher removed',
  'toast.addedShort': 'Added',

  /* ---- page titles ---- */
  'doc.title': 'MVP Marketplace',
};

const ES = {
  /* ---- shared building blocks ---- */
  'common.cancel': 'Cancelar',
  'common.remove': 'Quitar',
  'common.delete': 'Eliminar',
  'common.close': 'Cerrar',
  'common.back': 'Atrás',
  'common.save': 'Guardar',
  'common.edit': 'Editar',
  'common.add': 'Añadir',
  'common.apply': 'Aplicar',
  'common.reset': 'Restablecer',
  'common.default': 'Predeterminada',
  'common.saved': 'Guardado',
  'common.free': 'Gratis',
  'common.clearAll': 'Borrar todo',
  'common.loadMore': 'Cargar más',
  'common.selectedOf': '{selected} de {total} seleccionados',

  /* ---- counts / plurals ---- */
  'count.products.one': '{n} producto',
  'count.products.other': '{n} productos',
  'count.items.one': '{n} artículo',
  'count.items.other': '{n} artículos',
  'count.sold': '{n} vendidos',
  'count.followers': '{n} seguidores',
  'count.reviewsParen': '({n} reseñas)',
  'count.reviews': '{n} reseñas',
  'count.remaining': '{n}',
  'count.moreItems': '+{n} artículo más',
  'count.moreItemsPlural': '+{n} artículos más',
  'review.3_days_ago': 'hace 3 días',
  'review.1_week_ago': 'hace 1 semana',
  'review.2_weeks_ago': 'hace 2 semanas',
  'review.2_weeks_ago': 'hace 2 semanas',
  'review.3_weeks_ago': 'hace 3 semanas',
  'review.1_month_ago': 'hace 1 mes',
  'review.2_months_ago': 'hace 2 meses',
  'review.3_months_ago': 'hace 3 meses',

  /* ---- accessibility labels ---- */
  'aria.home': 'Inicio de MVP Marketplace',
  'aria.primaryNav': 'Principal',
  'aria.colorTheme': 'Tema de color',
  'aria.notifications': 'Notificaciones',
  'aria.cart': 'Carrito',
  'aria.promotions': 'Promociones',
  'aria.categories': 'Categorías',
  'aria.flashSale': 'Ofertas flash',
  'aria.recommended': 'Productos recomendados',
  'aria.results': 'Resultados',
  'aria.scrollLeft': 'Desplazar a la izquierda',
  'aria.scrollRight': 'Desplazar a la derecha',
  'aria.backToHome': 'Volver al inicio',
  'aria.filters': 'Filtros',
  'aria.closeFilters': 'Cerrar filtros',
  'aria.goToBanner': 'Ir al banner {n}',
  'aria.back': 'Atrás',
  'aria.toggleFavorite': 'Alternar favorito',
  'aria.addToCart': 'Añadir al carrito',
  'aria.soldOut': 'Agotado',
  'aria.decreaseQty': 'Reducir cantidad',
  'aria.increaseQty': 'Aumentar cantidad',
  'aria.saveForLater': 'Guardar para después',
  'aria.removeSavedItem': 'Quitar artículo guardado',
  'aria.removeFromCart': 'Quitar del carrito',
  'aria.selectProduct': 'Seleccionar {name}',
  'aria.selectAllItems': 'Seleccionar todos los artículos',
  'aria.removeVoucher': 'Quitar cupón',
  'aria.voucherCode': 'Código de cupón',
  'aria.colorOption': 'Color {name}',
  'aria.removeFilter': 'Quitar filtro {title}',
  'aria.removeCity': 'Quitar {city}',
  'aria.filterByLocation': 'Filtrar por ubicación',
  'aria.minPrice': 'Precio mínimo',
  'aria.maxPrice': 'Precio máximo',
  'aria.sortBy': 'Ordenar por',
  'aria.orderStatus': 'Estado del pedido',
  'aria.copyOrderNumber': 'Copiar número de pedido',
  'aria.copyTracking': 'Copiar número de seguimiento',
  'aria.close': 'Cerrar',
  'aria.prevPhoto': 'Foto anterior',
  'aria.nextPhoto': 'Foto siguiente',
  'aria.photoOf': 'Foto {i} de {n}',
  'aria.showPhotoOf': 'Mostrar foto {i} de {n}',
  'aria.changeProfilePhoto': 'Cambiar foto de perfil',
  'aria.removeItem': 'Quitar {name}',
  'aria.deleteAddress': 'Eliminar dirección',
  'aria.zoom': 'Zoom',
  'aria.ratedOutOf': 'Valorado con {rating} de {max}',

  /* ---- top nav + brand ---- */
  'nav.home': 'Inicio',
  'nav.categories': 'Categorías',
  'nav.cart': 'Carrito',
  'nav.orders': 'Pedidos',
  'nav.profile': 'Perfil',

  /* ---- search ---- */
  'search.placeholder': 'Buscar productos, marcas y más',
  'search.aria': 'Buscar productos',
  'search.title': 'Buscar',
  'search.recent': 'Búsquedas recientes',
  'search.trending': 'Búsquedas populares',
  'search.startTyping': 'Escribe para buscar.',
  'search.noMatches': 'Sin resultados para "{q}". Pulsa Enter para buscar igualmente.',
  'search.removeRecent': 'Quitar {q} de las búsquedas recientes',
  'search.heroTitle': 'Buscar en MVP Marketplace',
  'search.heroBody': 'Encuentra productos en todas las categorías. Empieza con una palabra, una marca o el nombre de una categoría.',
  'search.popular': 'Búsquedas populares',
  'search.resultsFor': 'Resultados para "{q}"',
  'search.docTitle': 'Buscar · MVP Marketplace',

  /* ---- home ---- */
  'home.categories': 'Categorías',
  'home.flashSale': 'Ofertas flash',
  'home.endsIn': 'Termina en',
  'home.recommended': 'Recomendado para ti',
  'home.more': 'Más',
  'home.bigDeals': 'Grandes ofertas',
  'home.limitedTime': 'Tiempo limitado',
  'home.noResults': 'Sin resultados',
  'home.noDealsBody': 'No hay productos rebajados ahora mismo. Prueba una búsqueda popular.',
  'home.clearSearch': 'Borrar búsqueda',
  'home.emptyTitle': 'No se encontraron productos.',
  'home.emptyBodyFilters': 'Prueba a cambiar los filtros.',
  'home.emptyBody': 'Ahora mismo no hay nada que mostrar aquí. Inténtalo de nuevo en un momento.',
  'home.loadFailed': 'No se pudieron cargar los productos. Actualiza o inténtalo de nuevo.',

  /* ---- promo banners ---- */
  'banner.deals.title': 'Gran fin de semana de ofertas',
  'banner.deals.body': 'Hasta un 60% de descuento en todas las categorías. Termina el domingo.',
  'banner.deals.cta': 'Ver las ofertas',
  'banner.flash.title': 'Ofertas flash en vivo',
  'banner.flash.body': 'Ofertas relámpago en los más vendidos. Desaparecen cuando el reloj llega a cero.',
  'banner.flash.cta': 'Ver ofertas flash',
  'banner.new.title': 'Novedades de temporada',
  'banner.new.body': 'Nuevos estilos y nueva tecnología en Moda y Electrónica.',
  'banner.new.cta': 'Explorar novedades',

  /* ---- categories + subcategories ---- */
  'cat.electronics': 'Electrónica',
  'cat.fashion': 'Moda',
  'cat.beauty': 'Belleza',
  'cat.home': 'Hogar',
  'cat.sports': 'Deportes',
  'cat.groceries': 'Supermercado',
  'cat.accessories': 'Accesorios',
  'sub.audio': 'Audio',
  'sub.phones': 'Teléfonos',
  'sub.computing': 'Informática',
  'sub.cameras': 'Cámaras',
  'sub.tv': 'TV y vídeo',
  'sub.wearables': 'Wearables',
  'sub.smarthome': 'Casa inteligente',
  'sub.tops': 'Tops',
  'sub.dresses': 'Vestidos',
  'sub.outerwear': 'Abrigos',
  'sub.bags': 'Bolsos',
  'sub.eyewear': 'Gafas',
  'sub.skincare': 'Cuidado de la piel',
  'sub.makeup': 'Maquillaje',
  'sub.furniture': 'Muebles',
  'sub.lighting': 'Iluminación',
  'sub.bedding': 'Ropa de cama',
  'sub.decor': 'Decoración',
  'sub.fitness': 'Fitness',
  'sub.outdoor': 'Aire libre',
  'sub.teamSports': 'Deportes de equipo',
  'sub.beverages': 'Bebidas',
  'sub.pantry': 'Despensa',
  'sub.fresh': 'Frescos',
  'sub.watches': 'Relojes',
  'sub.jewelry': 'Joyería',
  'sub.smallGoods': 'Bolsos y carteras',
  'sub.travel': 'Viaje',

  /* ---- sellers ---- */
  'seller.badge.official': 'Tienda oficial',
  'seller.badge.verified': 'Vendedor verificado',
  'seller.title': 'Vendedor',
  'seller.followers': '{n} seguidores',
  'seller.response': '{pct} de tasa de respuesta',
  'seller.since': 'Desde {year}',
  'seller.chat': 'Chatear con el vendedor',
  'seller.chatSoon': 'El chat con el vendedor llegará pronto',

  /* ---- browse / filters / sort ---- */
  'browse.all': 'Todo',
  'browse.searchIn': 'Buscar en {cat}',
  'browse.filter': 'Filtrar',
  'browse.sort': 'Ordenar: {label}',
  'browse.price': 'Precio',
  'browse.rating': 'Valoración de clientes',
  'browse.brand': 'Marca',
  'browse.discount': 'Descuento',
  'browse.availability': 'Disponibilidad',
  'browse.inStockOnly': 'Solo disponible',
  'browse.any': 'Cualquiera',
  'browse.priceAny': 'Cualquier precio',
  'browse.priceUnder20': 'Menos de $20',
  'browse.price20to100': '$20 a $100',
  'browse.price100to300': '$100 a $300',
  'browse.priceOver300': '$300 o más',
  'browse.rating45': '4.5 o más',
  'browse.rating40': '4.0 o más',
  'browse.rating35': '3.5 o más',
  'browse.discount10': '10% o más',
  'browse.discount20': '20% o más',
  'browse.discount30': '30% o más',
  'browse.show': 'Mostrar {count}',
  'browse.noResults': 'Sin resultados',
  'browse.noResultsCategoryBody': 'Ningún producto coincide con tus filtros en esta categoría. Prueba a borrarlos o a buscar otra palabra.',
  'browse.clearFilters': 'Borrar búsqueda y filtros',
  'browse.noResultsSearchBody': 'Ahora mismo nada coincide con "{q}". Prueba otra palabra o empieza por una búsqueda popular.',
  'browse.clearSearch': 'Borrar búsqueda',
  'browse.categoryNotFound': 'Categoría no encontrada',
  'browse.categoryNotFoundBody': 'Esa categoría no existe. Explora todas las categorías.',
  'browse.backToHome': 'Volver al inicio',
  'browse.allCategories': 'Todas las categorías',
  'browse.soFar': 'hasta ahora',

  'sort.recommended': 'Recomendado',
  'sort.popular': 'Popular',
  'sort.newest': 'Más reciente',
  'sort.priceAsc': 'Precio: de menor a mayor',
  'sort.priceDesc': 'Precio: de mayor a menor',
  'sort.topRated': 'Mejor valorados',
  'sort.bestSelling': 'Más vendidos',
  'sort.biggestDiscount': 'Mayor descuento',

  'filter.location': 'Ubicación',
  'filter.price': 'Precio',
  'filter.sortBy': 'Ordenar por',
  'filter.allLocations': 'Todas las ubicaciones',
  'filter.searchCities': 'Buscar ciudades',
  'filter.cities': 'Ciudades',
  'filter.noCities': 'Ninguna ciudad coincide',
  'filter.useMyLocation': 'Usar mi ubicación actual',
  'filter.min': 'Mín',
  'filter.max': 'Máx',
  'filter.priceHint': 'Introduce un importe y pulsa Aplicar.',
  'filter.priceSwap': 'El mínimo supera al máximo. Se intercambiarán al aplicar.',
  'filter.locationUnavailable': 'Los servicios de ubicación no están disponibles aquí.',
  'filter.locationDeclined': 'Se denegó el permiso de ubicación.',
  'filter.noCityNearby': 'Todavía no hay ninguna ciudad del marketplace cerca de ti.',
  'filter.locationError': 'No se pudo leer tu ubicación.',
  'filter.chipPriceRange': 'Precio {min} a {max}',
  'filter.chipFrom': 'Desde {min}',
  'filter.chipFromTitle': 'Precio desde {min}',
  'filter.chipUpTo': 'Hasta {max}',
  'filter.chipUpToTitle': 'Precio hasta {max}',
  'filter.chipSortTitle': 'Ordenar: {label}',

  /* ---- cart ---- */
  'cart.title': 'Carrito',
  'cart.empty': 'Tu carrito está vacío',
  'cart.emptyBody': 'Explora el catálogo y añade algo que te guste.',
  'cart.startShopping': 'Empezar a comprar',
  'cart.selectAll': 'Seleccionar todo',
  'cart.deselectAll': 'Deseleccionar todo',
  'cart.savedForLater': 'Guardado para después',
  'cart.moveToCart': 'Mover al carrito',
  'cart.lineTotal': 'Total de la línea',
  'cart.vouchers': 'Cupones',
  'cart.applied': 'Aplicado',
  'cart.apply': 'Aplicar',
  'cart.voucherPlaceholder': 'Introduce el código del cupón',
  'cart.voucherUnderMin': 'Tu pedido no llega al mínimo, así que aún no se aplica.',
  'cart.availableVouchers': 'Cupones disponibles',
  'cart.orderSummary': 'Resumen del pedido',
  'cart.subtotal': 'Subtotal ({items})',
  'cart.productDiscounts': 'Descuentos de productos',
  'cart.shipping': 'Envío',
  'cart.estimatedShipping': 'Envío estimado',
  'cart.total': 'Total',
  'cart.voucherRow': 'Cupón ({code})',
  'cart.checkout': 'Finalizar compra',
  'cart.checkoutLater': 'El pago y la compra llegarán en una fase posterior.',
  'cart.totalItems': 'Total ({items})',
  'cart.currencyPlaceholder': '-',
  'cart.confirmTitle': '¿Quitar el artículo?',
  'cart.confirmBody': '{name} se quitará de tu carrito.',
  'cart.removed': 'Artículo quitado del carrito',
  'cart.voucherNotValid': '"{code}" no es un código de cupón válido. Revisa la ortografía e inténtalo de nuevo.',
  'cart.voucherEnter': 'Introduce primero un código de cupón.',
  'cart.voucherMin': '"{code}" necesita un subtotal de {min}. Añade {more} más para usarlo.',
  'cart.voucherApplied': 'Cupón {code} aplicado',

  /* ---- vouchers (descriptions) ---- */
  'voucher.descPercent': '{value}% de descuento en tu pedido',
  'voucher.descFixed': '{value} de descuento en tu pedido',
  'voucher.descShip': 'Envío gratis en tu pedido',
  'voucher.descMin': 'pedidos superiores a {min}',

  /* ---- checkout ---- */
  'checkout.title': 'Finalizar compra',
  'checkout.backToCart': 'Volver al carrito',
  'checkout.emptyTitle': 'Tu carrito está vacío',
  'checkout.emptyBody': 'Añade artículos a tu carrito para finalizar la compra.',
  'checkout.continueShopping': 'Seguir comprando',
  'checkout.shippingAddress': 'Dirección de envío',
  'checkout.products': 'Productos',
  'checkout.shipping': 'Envío',
  'checkout.voucher': 'Cupón',
  'checkout.paymentMethod': 'Método de pago',
  'checkout.orderSummary': 'Resumen del pedido',
  'checkout.subtotal': 'Subtotal',
  'checkout.shippingFee': 'Envío',
  'checkout.discount': 'Descuento',
  'checkout.total': 'Total',
  'checkout.placeOrder': 'Realizar pedido',
  'checkout.mockNote': 'Compra simulada: no se realiza ningún pago real.',
  'checkout.choosePayment': 'Elegir método de pago',
  'checkout.changePayment': 'Cambiar método de pago',
  'checkout.paymentRequired': 'Elige un método de pago para realizar tu pedido',
  'checkout.destinationCountry': 'País de destino',
  'checkout.courier': 'Mensajería',
  'checkout.changeAddress': 'Cambiar dirección',
  'checkout.saveAddress': 'Guardar dirección',
  'checkout.voucherPlaceholder': 'Código de cupón',
  'checkout.voucherApply': 'Aplicar',
  'checkout.voucherRemove': 'Quitar',
  'checkout.voucherHint': 'Prueba MVP10 para un 10% de descuento en tu pedido.',
  'checkout.voucherPct10': '10% de descuento en tu pedido',
  'checkout.voucherFlat5': '$5.00 de descuento en tu pedido',
  'checkout.voucherEnter': 'Introduce un código de cupón',
  'checkout.voucherNotValid': 'Ese código no es válido',
  'checkout.qty': 'Cant. {n}',
  'checkout.each': '{price} cada uno',
  'checkout.addressSaved': 'Dirección guardada',
  'checkout.voucherApplied': 'Cupón aplicado: {label}',
  'checkout.checkFields': 'Revisa los campos marcados',
  'checkout.paymentChosen': 'Método de pago: {name}',
  'checkout.placing': 'Realizando el pedido…',
  'checkout.processing': 'Procesando el pago…',
  'checkout.successTitle': 'Pedido realizado correctamente',
  'checkout.orderNo': 'Pedido {no}',
  'checkout.estimatedDelivery': 'Entrega estimada',
  'checkout.payment': 'Pago',
  'checkout.viewOrder': 'Ver pedido',
  'checkout.fieldName': 'Nombre',
  'checkout.phName': 'Nombre completo',
  'checkout.fieldPhone': 'Teléfono',
  'checkout.phPhone': '+34 600 000 000',
  'checkout.fieldAddress': 'Dirección',
  'checkout.phAddress': 'Calle y número',
  'checkout.fieldCity': 'Ciudad',
  'checkout.phCity': 'Ciudad',
  'checkout.fieldPostal': 'Código postal',
  'checkout.phPostal': 'Código postal',
  'checkout.errName': 'Introduce tu nombre completo',
  'checkout.errPhone': 'Introduce un número de teléfono válido',
  'checkout.errAddress': 'Introduce tu dirección',
  'checkout.errCity': 'Introduce tu ciudad',
  'checkout.errPostal': 'Introduce un código postal válido',
  'checkout.methodCardName': 'Tarjeta de crédito / débito',
  'checkout.methodCardDesc': 'Visa, Mastercard, JCB',
  'checkout.methodBankName': 'Transferencia bancaria',
  'checkout.methodBankDesc': 'Cuenta virtual',
  'checkout.methodWalletName': 'Monedero electrónico',
  'checkout.methodWalletDesc': 'DANA, GoPay, OVO',
  'checkout.methodCodName': 'Contra reembolso',
  'checkout.methodCodDesc': 'Paga al mensajero a la entrega',
  'variant.electronics': 'Negro',
  'variant.fashion': 'Mediana',
  'variant.beauty': '50 ml',
  'variant.home': 'Estándar',
  'variant.sports': 'Talla única',
  'variant.groceries': '1 paquete',
  'variant.accessories': 'Estándar',

  /* ---- payment methods ---- */
  'payment.title': 'Métodos de pago',
  'payment.empty': 'No hay métodos de pago guardados',
  'payment.emptyBody': 'Añade una cuenta bancaria, un monedero o una tarjeta para pagar más rápido la próxima vez.',
  'payment.add': 'Añadir método de pago',
  'payment.setDefault': 'Predeterminado',
  'payment.groupBank': 'Transferencia bancaria / cuenta virtual',
  'payment.groupEwallet': 'Monederos electrónicos',
  'payment.groupCard': 'Tarjetas',
  'payment.groupOther': 'Otros',
  'payment.subVirtualAccount': 'Cuenta virtual',
  'payment.subEwallet': 'Monedero electrónico',
  'payment.subCard': 'Visa, Mastercard, JCB',
  'payment.subScan': 'Escanea para pagar',
  'payment.subCod': 'Paga al mensajero a la entrega',
  'payment.subStores': 'Indomaret, Alfamart',
  'payment.nameCard': 'Tarjeta de crédito / débito',
  'payment.nameCod': 'Contra reembolso',
  'payment.nameStores': 'Tiendas de conveniencia',
  'payment.addAccount': 'Añadir cuenta de {name}',
  'payment.link': 'Vincular {name}',
  'payment.linkShort': 'Añadir',
  'payment.addCard': 'Añadir una tarjeta',
  'payment.accountNumber': 'Número de cuenta',
  'payment.phAccountNumber': 'Número de cuenta bancaria',
  'payment.accountHolder': 'Nombre del titular',
  'payment.phAccountHolder': 'Nombre de la cuenta',
  'payment.phoneNumber': 'Número de teléfono',
  'payment.phPhoneNumber': 'Número de móvil registrado',
  'payment.cardNumber': 'Número de tarjeta',
  'payment.phCardNumber': '1234 5678 9012 3456',
  'payment.nameOnCard': 'Nombre en la tarjeta',
  'payment.phNameOnCard': 'Nombre tal como figura en la tarjeta',
  'payment.expiry': 'Caducidad',
  'payment.phExpiry': 'MM/AA',
  'payment.cvv': 'CVV',
  'payment.phCvv': '123',
  'payment.cardNote': 'Solo se guardan los últimos cuatro dígitos (•••• 4242). No se almacena el número completo de la tarjeta.',
  'payment.back': 'Atrás',
  'payment.errPhone': 'Introduce un número de móvil válido (9 a 15 dígitos)',
  'payment.errAccount': 'Introduce un número de cuenta válido (6 a 20 dígitos)',
  'payment.errHolder': 'Introduce el nombre del titular',
  'payment.errCard': 'Introduce un número de tarjeta válido',
  'payment.errCardHolder': 'Introduce el nombre en la tarjeta',
  'payment.errExpiry': 'Usa MM/AA',
  'payment.errCvv': 'Introduce el código de 3 o 4 dígitos',
  'payment.added': '{name} añadido',
  'payment.removed': '{name} quitado',
  'payment.setDefaultToast': '{name} marcado como predeterminado',
  'payment.defaultToast': 'Método marcado como predeterminado',
  'payment.removeTitle': '¿Quitar {name}?',
  'payment.removeBody': 'Esto quita de tu cuenta el método de pago guardado{detail}.',
  'payment.removeDetail': ' ({detail})',

  /* ---- addresses ---- */
  'addr.title': 'Direcciones',
  'addr.empty': 'Aún no hay direcciones',
  'addr.emptyBody': 'Guarda una dirección de envío para usarla al finalizar la compra.',
  'addr.add': 'Añadir dirección',
  'addr.defaultAddress': 'Dirección predeterminada',
  'addr.setDefault': 'Predeterminada',
  'addr.deleteTitle': '¿Eliminar la dirección?',
  'addr.deleteBody': 'Esto elimina la dirección guardada de {name}.',
  'addr.deleteBodyPlain': 'Esto elimina la dirección guardada.',
  'addr.defaultUpdated': 'Dirección predeterminada actualizada',
  'addr.deleted': 'Dirección eliminada',
  'addr.saved': 'Dirección guardada',
  'addr.fieldName': 'Nombre completo',
  'addr.fieldPhone': 'Teléfono',
  'addr.fieldStreet': 'Dirección',
  'addr.fieldCity': 'Ciudad',
  'addr.fieldZip': 'Código postal',
  'addr.makeDefault': 'Usar como dirección predeterminada',
  'addr.save': 'Guardar dirección',
  'addr.saveChanges': 'Guardar cambios',
  'addr.newTitle': 'Nueva dirección',
  'addr.editTitle': 'Editar dirección',

  /* ---- orders ---- */
  'orders.title': 'Pedidos',
  'orders.emptyAll': 'Aún no hay pedidos',
  'orders.emptyToPay': 'No hay pedidos por pagar',
  'orders.emptyToShip': 'No hay pedidos por enviar',
  'orders.emptyShipped': 'No hay pedidos enviados',
  'orders.emptyCompleted': 'No hay pedidos completados',
  'orders.emptyCancelled': 'No hay pedidos cancelados',
  'orders.emptyBody': 'Los pedidos con este estado aparecerán aquí en cuanto haya alguno.',
  'orders.tabAll': 'Todos',
  'orders.tabToPay': 'Por pagar',
  'orders.tabToShip': 'Por enviar',
  'orders.tabShipped': 'Enviados',
  'orders.tabCompleted': 'Completados',
  'orders.tabCancelled': 'Cancelados',
  'orders.statusToPay': 'Por pagar',
  'orders.statusToShip': 'Por enviar',
  'orders.statusShipped': 'Enviado',
  'orders.statusCompleted': 'Completado',
  'orders.statusCancelled': 'Cancelado',
  'orders.hintToPay': 'Pendiente de pago. Este pedido se envía en cuanto se confirme el pago.',
  'orders.hintToShip': 'Pago recibido. Estamos preparando tu pedido para el envío.',
  'orders.hintShipped': 'En camino. Sigue la entrega más abajo.',
  'orders.hintCompleted': 'Entregado. Esperamos que disfrutes de tu pedido.',
  'orders.hintCancelled': 'Este pedido se canceló. Cualquier pago se reembolsa en un plazo de 3 a 5 días hábiles.',
  'orders.no': 'N.º {no}',
  'orders.orderNo': 'Pedido {no}',
  'orders.qty': 'Cant. {n}',
  'orders.placed': 'Realizado el {date}',
  'orders.viewDetails': 'Ver detalles',
  'orders.buyAgain': 'Volver a comprar',
  'orders.detailTitle': 'Detalles del pedido',
  'orders.timeline': 'Cronología',
  'orders.shipping': 'Dirección de envío',
  'orders.products': 'Productos',
  'orders.paymentMethod': 'Método de pago',
  'orders.courier': 'Mensajería',
  'orders.shipTo': 'Enviar a {country} · ',
  'orders.paymentOnDelivery': 'Pago contra entrega',
  'orders.priceSummary': 'Resumen de precios',
  'orders.subtotal': 'Subtotal ({items})',
  'orders.productDiscounts': 'Descuentos de productos',
  'orders.shippingFee': 'Envío',
  'orders.total': 'Total',
  'orders.track': 'Seguir pedido',
  'orders.cancel': 'Cancelar pedido',
  'orders.contact': 'Contactar con el vendedor',
  'orders.stepPlaced': 'Pedido realizado',
  'orders.stepPaid': 'Pago confirmado',
  'orders.stepShipped': 'Enviado',
  'orders.stepDelivered': 'Entregado',
  'orders.stepCancelled': 'Pedido cancelado',
  'orders.stepPacking': 'Preparando tu pedido',
  'orders.hintPacking': 'Suele enviarse en 1-2 días',
  'orders.hintAwaitingPayment': 'Pendiente de pago',
  'orders.hintInTransit': 'En tránsito',
  'orders.itemsAdded': 'Artículos añadidos al carrito',
  'orders.cancelTitle': '¿Cancelar el pedido?',
  'orders.cancelBody': 'El pedido {no} se cancelará. Cualquier pago se reembolsa en un plazo de 3 a 5 días hábiles.',
  'orders.cancelConfirm': 'Cancelar pedido',
  'orders.cancelled': 'Pedido cancelado',
  'orders.trackTitle': 'Seguir pedido',
  'orders.tracking': 'Seguimiento {no}',
  'orders.checkpointCreated': 'Etiqueta creada',
  'orders.checkpointPickedUp': 'Recogido por {courier}',
  'orders.checkpointTransit': 'En tránsito',
  'orders.checkpointTransitHint': 'Avanzando por la red',
  'orders.checkpointDelivered': 'Entregado',
  'orders.estimated': 'Estimado {date}',
  'orders.deliveredBy': 'Entregado por {courier}',
  'orders.inTransitWith': 'En tránsito con {courier}. Llega pronto.',
  'orders.courierFallback': 'la mensajería',
  'orders.contactTitle': 'Contactar con el vendedor',
  'orders.contactBody': 'La mensajería con vendedores llega en una fase posterior. Tu número de pedido es {no}. Tenlo a mano al contactar con soporte.',
  'orders.copyOrderNumber': 'Copiar número de pedido',
  'orders.copied': 'Copiado',

  /* ---- profile ---- */
  'profile.title': 'Perfil',
  'profile.guest': 'Comprador invitado',
  'profile.signedInVia': 'Sesión iniciada con Homeroom',
  'profile.signInHint': 'Inicia sesión con Homeroom para sincronizar tu cuenta',
  'profile.editProfile': 'Editar perfil',
  'profile.statOrders': 'Pedidos',
  'profile.statWishlist': 'Lista de deseos',
  'profile.statCoupons': 'Cupones',
  'profile.colorTheme': 'Tema de color',
  'profile.myOrders': 'Mis pedidos',
  'profile.wishlist': 'Lista de deseos',
  'profile.addresses': 'Direcciones',
  'profile.paymentMethods': 'Métodos de pago',
  'profile.coupons': 'Cupones',
  'profile.notifications': 'Notificaciones',
  'profile.helpCenter': 'Centro de ayuda',
  'profile.settings': 'Ajustes',
  'profile.logout': 'Cerrar sesión',
  'profile.wishlistEmpty': 'Tu lista de deseos está vacía',
  'profile.wishlistEmptyBody': 'Toca el corazón de cualquier producto para guardarlo aquí.',
  'profile.couponsNote': 'Aplica un código en tu carrito antes de finalizar la compra.',
  'profile.useInCart': 'Usar en el carrito',
  'profile.notificationsEmpty': 'Estás al día',
  'profile.notificationsEmptyBody': 'Las actualizaciones de pedidos y las promociones aparecerán aquí.',
  'profile.notificationSettings': 'Ajustes de notificaciones',
  'profile.helpQ1': '¿Dónde está mi pedido?',
  'profile.helpA1': 'Abre el pedido desde Mis pedidos y consulta su cronología. El seguimiento aparece cuando se envía.',
  'profile.helpQ2': '¿Cuánto tarda la entrega?',
  'profile.helpA2': 'La entrega estándar tarda de 3 a 5 días hábiles. La exprés llega en 1-2 días hábiles.',
  'profile.helpQ3': '¿Puedo cancelar un pedido?',
  'profile.helpA3': 'Sí, mientras esté Por pagar o Por enviar. Abre el pedido y toca Cancelar pedido.',
  'profile.helpQ4': '¿Cómo funcionan las devoluciones?',
  'profile.helpA4': 'Las devoluciones llegan en una fase posterior. Mientras tanto, usa Contactar con el vendedor en el pedido.',
  'profile.helpQ5': '¿Qué métodos de pago puedo usar?',
  'profile.helpA5': 'Transferencia bancaria y cuentas virtuales, monederos electrónicos, tarjetas, QRIS y contra reembolso. Gestiónalos en Perfil > Métodos de pago.',
  'profile.logoutTitle': '¿Cerrar sesión?',
  'profile.logoutBody': 'MVP Marketplace guarda tu carrito, lista de deseos, direcciones y ajustes en este dispositivo. Al cerrar sesión se borran.',
  'profile.logoutConfirm': 'Cerrar sesión',
  'profile.loggedOut': 'Sesión cerrada',

  /* ---- settings ---- */
  'settings.title': 'Ajustes',
  'settings.account': 'Cuenta',
  'settings.accountSettings': 'Ajustes de la cuenta',
  'settings.notifications': 'Notificaciones',
  'settings.orderUpdates': 'Actualizaciones de pedidos',
  'settings.promotions': 'Promociones y ofertas',
  'settings.preferences': 'Preferencias',
  'settings.language': 'Idioma',
  'settings.theme': 'Tema',
  'settings.privacy': 'Privacidad',
  'settings.personalized': 'Recomendaciones personalizadas',
  'settings.saveSearch': 'Guardar historial de búsquedas',
  'settings.languagePickerTitle': 'Idioma',
  'settings.languageSet': 'Idioma cambiado a {label}',
  'settings.useLanguagePicker': 'Usa el selector de idioma en Ajustes',
  'settings.useSwatches': 'Usa las muestras de color para cambiar el tema (cabecera en escritorio, página de Perfil en móvil)',
  'settings.editTitle': 'Editar perfil',
  'settings.photo': 'Foto de perfil',
  'settings.photoHint': 'Toca la foto para elegir de tu galería o quitarla.',
  'settings.change': 'Cambiar',
  'settings.displayName': 'Nombre visible',
  'settings.email': 'Correo electrónico',
  'settings.phone': 'Teléfono',
  'settings.saveChanges': 'Guardar cambios',
  'settings.signInNote': 'Tu sesión permanece en Homeroom. Estos datos personalizan tu cuenta de MVP Marketplace.',
  'settings.profileSaved': 'Perfil guardado',

  /* ---- profile photo ---- */
  'photo.invalid': 'Elige una imagen JPG, PNG o WEBP.',
  'photo.tooLarge': 'Esa imagen es demasiado grande. Prueba con una más pequeña.',
  'photo.failed': 'No se pudo subir tu foto. Inténtalo de nuevo.',
  'photo.unavailable': 'Las subidas de fotos no están disponibles aquí.',
  'photo.menuTitle': 'Foto de perfil',
  'photo.choose': 'Elegir de la galería',
  'photo.remove': 'Quitar foto',
  'photo.removeTitle': '¿Quitar la foto de perfil?',
  'photo.removeBody': 'Tu avatar volverá al marcador con la letra.',
  'photo.removeConfirm': 'Quitar foto',
  'photo.removePhoto': 'Quitar foto',
  'photo.removed': 'Foto de perfil quitada',
  'photo.updated': 'Foto de perfil actualizada',
  'photo.addTitle': 'Añadir foto',
  'photo.zoom': 'Zoom',
  'photo.cancel': 'Cancelar',
  'photo.save': 'Guardar foto',
  'photo.saving': 'Guardando…',
  'photo.cropHint': 'Arrastra para reencuadrar, pellizca o usa el control para el zoom. El círculo muestra cómo se verá tu avatar.',
  'photo.noPhoto': 'Ninguna foto seleccionada',
  'photo.noPhotoBody': 'Elige una imagen de tu galería para poner una foto de perfil.',

  /* ---- theme ---- */
  'theme.switchTo': 'Cambiar al tema {name}',

  /* ---- product detail ---- */
  'product.soldOut': 'Agotado',
  'product.color': 'Color: ',
  'product.size': 'Talla: ',
  'product.quantity': 'Cantidad',
  'product.freeShipping': 'Envío gratis',
  'product.shipping': 'Envío {fee}',
  'product.arrivesIn': ' · Llega en {eta}',
  'product.returns': 'Devoluciones gratis en 30 días',
  'product.etaFast': '2-4 días hábiles',
  'product.etaSlow': '3-5 días hábiles',
  'product.description': 'Descripción',
  'product.reviews': 'Reseñas',
  'product.verified': 'Compra verificada',
  'product.youMayLike': 'También te puede gustar',
  'product.recentlyViewed': 'Vistos recientemente',
  'product.addToCart': 'Añadir al carrito',
  'product.buyNow': 'Comprar ahora',
  'product.notFound': 'Producto no encontrado',
  'product.notFoundBody': 'Ese producto ya no está disponible. Explora el catálogo para encontrar algo similar.',
  'product.backToHome': 'Volver al inicio',
  'product.docTitle': '{name} · MVP Marketplace',
  'product.docNotFound': 'Producto no encontrado · MVP Marketplace',
  'product.photoAlt': 'Foto {i} de {name}',
  'product.addedToCart': 'Añadido al carrito',

  /* ---- spec labels ---- */
  'specifications': 'Especificaciones',
  'description': 'Descripción',
  'reviews': 'Reseñas',
  'inStock': 'Disponible',
  'soldOut': 'Agotado',
  'spec.display': 'Pantalla',
  'spec.processor': 'Procesador',
  'spec.ram': 'Memoria RAM',
  'spec.storage': 'Almacenamiento',
  'spec.graphics': 'Gráficos',
  'spec.battery': 'Batería',
  'spec.weight': 'Peso',
  'spec.os': 'Sistema operativo',
  'spec.ports': 'Puertos',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Cámara',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Tallas',
  'spec.fit': 'Corte',
  'spec.care': 'Cuidados',
  'spec.origin': 'Origen',
  'spec.dimensions': 'Dimensiones',
  'spec.power': 'Potencia / Capacidad',
  'spec.brand': 'Marca',
  'spec.model': 'Modelo',
  'spec.sku': 'ID de producto',
  'spec.stock': 'Disponibilidad',
  'spec.warranty': 'Garantía',

  /* ---- global toasts ---- */
  'toast.addedToFavorites': 'Añadido a favoritos',
  'toast.removedFromFavorites': 'Quitado de favoritos',
  'toast.soldOut': 'Este artículo está agotado',
  'toast.comingSoon': 'Llegará en una fase posterior',
  'toast.savedForLater': 'Guardado para después',
  'toast.movedToCart': 'Movido al carrito',
  'toast.removedFromSaved': 'Quitado de los artículos guardados',
  'toast.voucherRemoved': 'Cupón quitado',
  'toast.addedShort': 'Añadido',

  /* ---- page titles ---- */
  'doc.title': 'MVP Marketplace',
};

/* Partial dictionaries, kept from the previous release so `?lang=pt-BR` and
 * `?lang=id` still translate the Specifications vocabulary. They cover only a
 * handful of keys, so they are NOT offered in the Settings picker (their keys
 * are listed in COMPLETE_LOCALES' absence); a missing key falls back to
 * English. Complete them and add the tag to COMPLETE_LOCALES to ship them. */
const PT_BR = {
  specifications: 'Especificações',
  description: 'Descrição',
  reviews: 'Avaliações',
  inStock: 'Em estoque',
  soldOut: 'Esgotado',
  'spec.display': 'Tela',
  'spec.processor': 'Processador',
  'spec.ram': 'Memória RAM',
  'spec.storage': 'Armazenamento',
  'spec.graphics': 'Gráficos',
  'spec.battery': 'Bateria',
  'spec.weight': 'Peso',
  'spec.os': 'Sistema operacional',
  'spec.ports': 'Portas',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Câmera',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Tamanhos',
  'spec.fit': 'Caimento',
  'spec.care': 'Cuidados',
  'spec.origin': 'Origem',
  'spec.dimensions': 'Dimensões',
  'spec.power': 'Potência / Capacidade',
  'spec.brand': 'Marca',
  'spec.model': 'Modelo',
  'spec.sku': 'ID do produto',
  'spec.stock': 'Disponibilidade',
  'spec.warranty': 'Garantia',
};

const ID = {
  specifications: 'Spesifikasi',
  description: 'Deskripsi',
  reviews: 'Ulasan',
  inStock: 'Tersedia',
  soldOut: 'Habis',
  'spec.display': 'Layar',
  'spec.processor': 'Prosesor',
  'spec.ram': 'RAM',
  'spec.storage': 'Penyimpanan',
  'spec.graphics': 'Grafis',
  'spec.battery': 'Baterai',
  'spec.weight': 'Berat',
  'spec.os': 'Sistem operasi',
  'spec.ports': 'Port',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Kamera',
  'spec.sim': 'SIM',
  'spec.material': 'Bahan',
  'spec.sizes': 'Ukuran',
  'spec.fit': 'Potongan',
  'spec.care': 'Perawatan',
  'spec.origin': 'Asal',
  'spec.dimensions': 'Dimensi',
  'spec.power': 'Daya / Kapasitas',
  'spec.brand': 'Merek',
  'spec.model': 'Model',
  'spec.sku': 'ID produk',
  'spec.stock': 'Stok',
  'spec.warranty': 'Garansi',
};

const DICTS = { en: EN, es: ES, 'pt-BR': PT_BR, id: ID };

/* Map any BCP-47 tag onto a shipped dictionary (language-subtag match), or
 * 'en' when nothing matches. */
export function normalize(code) {
  if (!code || typeof code !== 'string') return 'en';
  if (DICTS[code]) return code;
  const base = code.toLowerCase().split('-')[0];
  for (const key of Object.keys(DICTS)) {
    if (key.toLowerCase().split('-')[0] === base) return key;
  }
  return 'en';
}

/* The active display locale. Kept in module state (not read from the store on
 * every call) so applyLocale() can set it once and every t() reflects it
 * immediately, including a re-render triggered by a locale change. */
let activeLocale = null;

export function locale() {
  if (activeLocale) return activeLocale;
  const pref = store && store.prefs ? store.prefs.locale : null;
  activeLocale = normalize(pref);
  return activeLocale;
}

/* The BCP-47 tag handed to Intl for dates, numbers and currency. `en` maps to
 * `en-US` so the app's English formatting is unchanged; every other shipped
 * tag is passed through (a documented language-subtag match). */
const INTL_TAGS = { en: 'en-US', es: 'es', 'pt-BR': 'pt-BR', id: 'id' };

export function intlLocale() {
  const code = locale();
  return INTL_TAGS[code] || code;
}

/* Fill {name} slots in a translation. */
function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, key) => (
    params[key] === undefined || params[key] === null ? m : String(params[key])
  ));
}

/* Warn once per missing key, in development-shaped runs only. The platform's
 * check counts console *errors*, so this is a warn and never breaks a page. */
const warned = new Set();
function warnMissing(key) {
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[i18n] missing key: ' + key);
  }
}

/* Look a key up: active locale, then English, then the caller's own label,
 * then the key. `params` fills {name} slots. */
export function t(key, params) {
  const dict = DICTS[locale()];
  let value;
  if (dict && dict[key] !== undefined) value = dict[key];
  else if (EN[key] !== undefined) value = EN[key];
  else {
    warnMissing(key);
    if (params && typeof params.default === 'string') return interpolate(params.default, params);
    return key;
  }
  return interpolate(value, params);
}

/* The pluralized form of a keyed string: `plural('count.items', n)` picks
 * `count.items.one` or `count.items.other` and fills {n}. */
export function plural(key, n, params) {
  const form = n === 1 ? '.one' : '.other';
  return t(key + form, Object.assign({ n }, params));
}

/* ------------------------------------------------------------------ */
/* Locale resolution + lifecycle                                       */
/* ------------------------------------------------------------------ */

/* A `?lang=` value from the URL, if any. A display override only: it is not
 * persisted and never writes the store or the profile. */
export function urlLocale() {
  try {
    const tag = new URLSearchParams(window.location.search).get('lang');
    return tag ? tag.trim() : null;
  } catch {
    return null;
  }
}

/* The browser's preferred language, or null when it cannot be read. */
export function deviceLocale() {
  try {
    if (navigator.languages && navigator.languages.length) return navigator.languages[0];
    return navigator.language || null;
  } catch {
    return null;
  }
}

/* The saved in-app choice, or null when the shopper has never picked one. The
 * store seeds `locale` to 'en'; that untouched default is NOT a choice, so
 * device/platform detection still applies for a first visit. */
export function savedLocale() {
  try {
    const saved = store && store.prefs ? store.prefs.locale : null;
    return saved && saved !== 'en' ? saved : null;
  } catch {
    return null;
  }
}

/* The platform user's language, if the bridge can answer. Never rejects; null
 * when unset or the bridge is absent. */
export async function platformLocale() {
  try {
    if (window.usernode && typeof window.usernode.getUserLocale === 'function') {
      const r = await window.usernode.getUserLocale();
      if (r && r.locale) return r.locale;
    }
  } catch {
    // Bridge absent or refused: fall through to the device language.
  }
  return null;
}

/* The synchronous starting locale, resolved before first render:
 *   ?lang=  >  saved preference  >  device language  >  English.
 * The async platform tag refines this from applyLocaleAsync(). */
export function resolveLocaleSync() {
  const url = urlLocale();
  if (url) return normalize(url);
  const saved = savedLocale();
  if (saved) return normalize(saved);
  const device = deviceLocale();
  if (device) return normalize(device);
  return 'en';
}

/* Apply the sync locale, then refine it with the platform user language when
 * that differs and the shopper has not overridden it with ?lang= or a saved
 * choice. Returns the sync locale. */
export async function resolveLocale() {
  const sync = resolveLocaleSync();
  applyLocale(sync);
  if (urlLocale() || savedLocale()) return sync;
  const platform = await platformLocale();
  if (platform) {
    const mapped = normalize(platform);
    if (mapped !== activeLocale) applyLocale(mapped);
  }
  return locale();
}

const localeListeners = new Set();

export function onLocaleChange(fn) {
  localeListeners.add(fn);
  return () => localeListeners.delete(fn);
}

/* Re-apply the static chrome and every mounted view for `code`, then tell
 * subscribers. Called on boot (with the resolved locale) and whenever the
 * shopper picks a language in Settings, which is what re-renders every page
 * immediately without a reload. */
export function applyLocale(code, { persist = false, rerender = true } = {}) {
  const next = normalize(code);
  activeLocale = next;
  try {
    document.documentElement.lang = next;
  } catch {
    // No DOM (a unit context): the locale still switches in memory.
  }
  if (persist && store && store.setPref) store.setPref('locale', next);
  hydrateStatic();
  if (rerender) {
    localeListeners.forEach((fn) => {
      try {
        fn(next);
      } catch (e) {
        console.error('locale listener failed', e);
      }
    });
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* Catalog vocabulary                                                  */
/* ------------------------------------------------------------------ */
/* Localized lookups for the shared catalog data (data.js). Product and
 * category content stays the same object everywhere; only the chrome around
 * it is translated, so these read the dictionary at the render site rather
 * than mutating the shared data. Each falls back to the source string when a
 * key is absent, which is also what keeps the SERVER (which loads data.js via
 * CommonJS and never imports this browser module) unaffected. */

/* "Electronics" -> t('cat.electronics'). */
export function categoryName(id, fallback) {
  return t('cat.' + id, fallback ? { default: fallback } : undefined);
}

/* "audio" -> t('sub.audio'). */
export function subcategoryLabel(id, fallback) {
  return t('sub.' + id, fallback ? { default: fallback } : undefined);
}

/* A sort id -> its localized label. Covers both the filter service's ids and
 * the browse page's own list; an unknown id falls back to the id itself. */
const SORT_KEYS = {
  recommended: 'sort.recommended',
  popular: 'sort.popular',
  newest: 'sort.newest',
  price_asc: 'sort.priceAsc',
  'price-asc': 'sort.priceAsc',
  price_desc: 'sort.priceDesc',
  'price-desc': 'sort.priceDesc',
  top_rated: 'sort.topRated',
  best_selling: 'sort.bestSelling',
  biggest_discount: 'sort.biggestDiscount',
};

export function sortOptionLabel(id) {
  const key = SORT_KEYS[id];
  return key ? t(key) : id;
}

/* A product's shipping estimate ("2-4 business days"). */
export function shippingEta(p) {
  let sum = 0;
  const s = String(p && p.id ? p.id : '');
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return t(sum % 3 === 0 ? 'product.etaSlow' : 'product.etaFast');
}

/* A review's relative age ("3 days ago"). */
const REVIEW_AGE_KEYS = ['3 days ago', '1 week ago', '2 weeks ago', '2 weeks ago', '3 weeks ago', '1 month ago', '2 months ago', '3 months ago'];
/* Localize a review's age label. `source` is the English label the catalog
 * carries (r.when); an index into REVIEW_AGE_KEYS is also accepted. An
 * unknown label falls back to itself rather than dropping the text. */
export function reviewAge(source) {
  const label = typeof source === 'number'
    ? REVIEW_AGE_KEYS[((source % REVIEW_AGE_KEYS.length) + REVIEW_AGE_KEYS.length) % REVIEW_AGE_KEYS.length]
    : source;
  if (!label) return '';
  const key = 'review.' + String(label).replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  return t(key, { default: label });
}

/* A banner's localized title/body/cta, keyed by banner id. `b` is the raw
 * BANNERS entry; the English text it carries stays the fallback. */
const BANNER_KEYS = {
  'mega-weekend': 'deals',
  'flash-live': 'flash',
  'new-season': 'new',
};
export function bannerText(b, part) {
  const slug = BANNER_KEYS[b && b.id];
  const source = part === 'title' ? b.title : part === 'body' ? b.subtitle : b.cta;
  if (!slug) return source;
  return t('banner.' + slug + '.' + part, { default: source });
}

/* The endonym for a locale tag, or the tag itself. */
export function localeName(code) {
  return LOCALE_NAMES[code] || code;
}

/* A localized one-line voucher description ("10% off your order · orders over
 * $20.00"), matching the old voucherDescription wording. */
export function voucherLabel(v) {
  if (!v) return '';
  const base = v.type === 'percent'
    ? t('voucher.descPercent', { value: v.value })
    : v.type === 'fixed'
      ? t('voucher.descFixed', { value: '$' + (v.value / 100).toFixed(2) })
      : t('voucher.descShip');
  return base + ' · ' + t('voucher.descMin', { min: '$' + (v.min / 100).toFixed(2) });
}

/* ------------------------------------------------------------------ */
/* Static chrome                                                       */
/* ------------------------------------------------------------------ */
/* The top nav, the two search inputs, the section headings and every
 * aria-label live in index.html. Rather than duplicate them in the
 * dictionary and in markup, index.html tags each with `data-i18n` (text) or
 * `data-i18n-attr` (an attribute, e.g. "placeholder:search.placeholder"), and
 * this pass fills them. Runs at boot and again after a language change, so
 * the header switches language without a reload. */

export function hydrateStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    // "placeholder:search.placeholder" or "aria-label:aria.cart", one per ';'.
    el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx === -1) return;
      const attr = pair.slice(0, idx).trim();
      const key = pair.slice(idx + 1).trim();
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
