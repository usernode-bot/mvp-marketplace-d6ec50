/* Phrase banks for the generated customer reviews.
 *
 * A review is composed, not copied: an opener, one sentence that only makes
 * sense for that kind of product (the subcategory bank), one about a named
 * aspect of the product type, an optional detail (how long it was used, which
 * variant was bought), and a closer. Negative reviews draw their complaint
 * from the category's own problems (battery, sizing, skin reaction, melted
 * chocolate) and from the shared delivery / packaging / service problems.
 * The generator re-rolls until no two review bodies are identical.
 */

/* Five aspects per product type (singular, so "The {a} is ..." reads right). */
export const ASPECTS = {
  earbuds: ['battery life', 'sound quality', 'fit in the ear', 'Bluetooth connection', 'charging case'],
  headphones: ['noise cancelling', 'ear cushion comfort', 'sound quality', 'battery life', 'build quality'],
  speaker: ['bass', 'volume', 'battery life', 'Bluetooth range', 'water resistance'],
  smartphone: ['camera', 'screen', 'battery life', 'performance', 'fast charging'],
  'phone-case': ['grip', 'fit', 'drop protection', 'button feel', 'finish'],
  'wireless-charger': ['charging speed', 'coil alignment', 'build quality', 'cable', 'heat'],
  laptop: ['screen', 'battery life', 'keyboard', 'performance', 'fan noise'],
  keyboard: ['key feel', 'typing sound', 'connection', 'build quality', 'backlight'],
  monitor: ['picture quality', 'colour accuracy', 'stand', 'refresh rate', 'brightness'],
  mouse: ['click feel', 'tracking', 'battery life', 'grip', 'scroll wheel'],
  'action-camera': ['video quality', 'stabilization', 'battery life', 'waterproofing', 'mounting'],
  mirrorless: ['image quality', 'autofocus', 'battery life', 'grip', 'menu system'],
  tripod: ['stability', 'height range', 'leg locks', 'weight', 'carry bag'],
  'smart-tv': ['picture quality', 'speaker sound', 'smart apps', 'remote', 'wall mount fit'],
  soundbar: ['dialogue clarity', 'bass', 'HDMI connection', 'remote', 'build quality'],
  projector: ['brightness', 'focus', 'fan noise', 'picture sharpness', 'speaker'],
  smartwatch: ['screen', 'battery life', 'step tracking', 'notifications', 'strap comfort'],
  'fitness-band': ['battery life', 'heart-rate tracking', 'sleep tracking', 'strap', 'app'],
  'smart-bulb': ['brightness', 'colour range', 'app pairing', 'Wi-Fi connection', 'voice control'],
  'security-camera': ['video quality', 'night vision', 'motion alerts', 'app', 'setup'],
  'smart-plug': ['app pairing', 'schedule feature', 'Wi-Fi connection', 'size', 'build quality'],
  tshirt: ['fabric', 'fit', 'stitching', 'colour', 'neckline'],
  hoodie: ['fabric thickness', 'fit', 'hood', 'stitching', 'warmth'],
  'button-shirt': ['fabric', 'fit', 'collar', 'stitching', 'buttons'],
  'summer-dress': ['fabric', 'fit', 'length', 'print', 'lining'],
  'maxi-dress': ['fabric', 'fit', 'length', 'flow', 'zipper'],
  'wrap-dress': ['fabric', 'fit', 'tie closure', 'length', 'neckline'],
  'denim-jacket': ['denim weight', 'fit', 'stitching', 'buttons', 'wash'],
  'puffer-jacket': ['warmth', 'fit', 'zipper', 'filling', 'weight'],
  'rain-jacket': ['waterproofing', 'fit', 'hood', 'zipper', 'breathability'],
  backpack: ['capacity', 'zipper', 'shoulder strap comfort', 'stitching', 'laptop sleeve'],
  tote: ['canvas thickness', 'handle strength', 'size', 'stitching', 'inner pocket'],
  crossbody: ['strap', 'zipper', 'size', 'material', 'compartments'],
  sunglasses: ['lens clarity', 'frame fit', 'polarization', 'finish', 'case'],
  'blue-light': ['lens quality', 'frame comfort', 'fit', 'finish', 'case'],
  serum: ['texture', 'scent', 'absorption', 'packaging', 'result on my skin'],
  moisturizer: ['texture', 'scent', 'hydration', 'absorption', 'jar'],
  sunscreen: ['white cast', 'texture', 'scent', 'finish under makeup', 'tube'],
  cleanser: ['lather', 'scent', 'skin feel after washing', 'texture', 'bottle'],
  lipstick: ['colour payoff', 'staying power', 'comfort on the lips', 'shade', 'scent'],
  foundation: ['coverage', 'shade match', 'finish', 'staying power', 'applicator'],
  mascara: ['volume', 'length', 'clumping', 'smudge resistance', 'wand'],
  palette: ['pigmentation', 'blendability', 'shade range', 'fallout', 'mirror'],
  'office-chair': ['lumbar support', 'seat cushion', 'assembly', 'armrests', 'wheels'],
  bookshelf: ['sturdiness', 'assembly', 'shelf depth', 'finish', 'wall fixing'],
  'coffee-table': ['stability', 'surface', 'assembly', 'size', 'finish'],
  desk: ['motor', 'stability', 'desktop surface', 'assembly', 'cable management'],
  'desk-lamp': ['brightness', 'light colour', 'arm', 'base', 'touch controls'],
  'floor-lamp': ['brightness', 'stability', 'height', 'switch', 'shade'],
  pendant: ['brightness', 'installation', 'cord length', 'finish', 'shade'],
  'duvet-set': ['fabric softness', 'stitching', 'colour', 'zipper', 'size'],
  pillow: ['support', 'firmness', 'cover fabric', 'loft', 'smell out of the box'],
  'weighted-blanket': ['weight', 'fabric', 'stitching', 'bead distribution', 'warmth'],
  vase: ['glaze', 'shape', 'size', 'weight', 'packaging'],
  'wall-clock': ['silence', 'readability', 'frame', 'size', 'battery fit'],
  candle: ['scent throw', 'burn time', 'wick', 'jar', 'scent'],
  dumbbells: ['weight adjustment', 'grip', 'build quality', 'tray', 'plates'],
  'yoga-mat': ['grip', 'cushioning', 'thickness', 'smell', 'carry strap'],
  bands: ['resistance', 'durability', 'handles', 'door anchor', 'carry bag'],
  'jump-rope': ['rope speed', 'handle grip', 'cable length', 'bearings', 'adjustability'],
  tent: ['setup', 'waterproofing', 'ventilation', 'space inside', 'poles'],
  'hiking-pack': ['fit', 'hip belt', 'capacity', 'zippers', 'rain cover'],
  'water-bottle': ['insulation', 'lid', 'leak-proofing', 'size', 'finish'],
  'sleeping-bag': ['warmth', 'zipper', 'size', 'packed size', 'lining'],
  basketball: ['grip', 'bounce', 'size', 'durability', 'feel'],
  'soccer-ball': ['stitching', 'bounce', 'shape retention', 'feel', 'durability'],
  volleyball: ['touch', 'flight', 'grip', 'stitching', 'durability'],
  'coffee-beans': ['aroma', 'roast', 'freshness', 'flavour', 'packaging'],
  'loose-tea': ['aroma', 'flavour', 'freshness', 'leaf quality', 'packaging'],
  'cold-brew': ['smoothness', 'sweetness', 'strength', 'freshness', 'bottle'],
  'olive-oil': ['flavour', 'freshness', 'bottle', 'pour spout', 'aroma'],
  pasta: ['texture', 'cooking time', 'shape', 'taste', 'packaging'],
  honey: ['sweetness', 'texture', 'aroma', 'jar', 'taste'],
  granola: ['crunch', 'sweetness', 'freshness', 'clusters', 'packaging'],
  apples: ['crunch', 'sweetness', 'freshness', 'size', 'packing'],
  avocados: ['ripeness', 'creaminess', 'size', 'freshness', 'packing'],
  tomatoes: ['flavour', 'ripeness', 'firmness', 'freshness', 'packing'],
  'analog-watch': ['dial', 'strap', 'timekeeping', 'case size', 'glass'],
  'digital-watch': ['display', 'backlight', 'strap', 'battery', 'buttons'],
  necklace: ['chain', 'clasp', 'pendant', 'finish', 'length'],
  bracelet: ['clasp', 'finish', 'fit', 'chain', 'weight'],
  earrings: ['posts', 'finish', 'size', 'comfort', 'back'],
  wallet: ['leather', 'stitching', 'card slots', 'size', 'smell'],
  'card-holder': ['leather', 'card slots', 'thumb slot', 'size', 'stitching'],
  belt: ['leather', 'buckle', 'holes', 'width', 'stitching'],
  suitcase: ['wheels', 'handle', 'zipper', 'shell', 'size'],
  'packing-cubes': ['zippers', 'fabric', 'sizes', 'mesh', 'stitching'],
  'travel-pillow': ['neck support', 'cover', 'firmness', 'clip', 'carry bag'],
};

/* Per subcategory: sentences that only fit that kind of product. */
export const SUB_BANK = {
  'electronics/audio': {
    pros: ['Battery easily lasts a full day of commuting and I only charge it twice a week.', 'Paired with my phone in seconds and has not dropped the connection once.', 'Sound is clear with proper bass, nothing like the tinny audio I expected at this price.', 'Calls come through clean, my colleagues say they can hear me fine even on a busy street.'],
    cons: ['Battery drains much faster than the listing promises, barely five hours at normal volume.', 'The Bluetooth connection cuts out every few minutes when I walk with my phone in a back pocket.', 'Bass is muddy and the highs get harsh once you turn the volume past halfway.', 'The left side stopped working after about three weeks of light use.'],
  },
  'electronics/phones': {
    pros: ['Charges quickly and the battery gets me through a heavy day of messaging and videos.', 'Looks and feels more premium than the price suggests, and nothing lags in everyday apps.', 'Fits perfectly with every cutout lined up and the buttons clicking nicely.', 'Picked up charge right away when I put it on the stand, no fiddling with positioning.'],
    cons: ['Gets noticeably warm while charging and the battery percentage drops quickly afterwards.', 'The camera struggles indoors and photos look soft once the light fades.', 'The case yellowed after a month and the edges started to peel away from the body.', 'Charging stops unless I place it in exactly the right spot, which is annoying at night.'],
  },
  'electronics/computing': {
    pros: ['Starts up quickly and handles my spreadsheets, video calls and a dozen browser tabs without hesitation.', 'The build feels sturdy and the keys have a satisfying, consistent response.', 'Set up took minutes, the driver installed itself and everything worked straight away.', 'The picture is sharp and comfortable on my eyes during long working days.'],
    cons: ['The fan gets loud as soon as I open more than a couple of tabs.', 'A few keys started double-typing after a month, which is a dealbreaker for me.', 'Dead pixel appeared near the corner after a week and support took ages to reply.', 'The wireless receiver disconnects randomly and I have to replug it to get the cursor back.'],
  },
  'electronics/cameras': {
    pros: ['Footage is crisp and the stabilization smooths out even a bumpy motorbike ride.', 'Photos have lovely colour straight out of the camera and the autofocus locks on fast.', 'Very stable on uneven ground and the legs lock without any slipping.', 'Easy to mount and the battery covers a full afternoon of shooting.'],
    cons: ['Battery runs out in about forty minutes of recording, so I had to buy spares.', 'Autofocus hunts in low light and I missed several shots because of it.', 'One leg lock loosened after a few uses and the tripod slowly sinks while the camera is on it.', 'The waterproof door felt flimsy and I did not dare take it into the water.'],
  },
  'electronics/tv': {
    pros: ['Colours look vivid and the screen is bright enough for a living room with windows.', 'Connected to the Wi-Fi quickly and the apps open without long waits.', 'Dialogue is much clearer than my old TV speakers and movies feel fuller now.', 'Set up was easy, the wall bracket holes matched and it sits flat against the wall.'],
    cons: ['The smart menu is slow and sometimes freezes for a few seconds before responding.', 'There is visible backlight bleeding in the corners when watching dark scenes.', 'The remote is flimsy and lost its pairing after a couple of weeks.', 'Fan noise is audible in a quiet room and the picture looks washed out in daytime.'],
  },
  'electronics/wearables': {
    pros: ['Battery lasts almost a week and the screen stays readable in bright sunlight.', 'Step and heart-rate numbers line up with my phone app and the strap is comfortable all day.', 'Notifications arrive instantly and the app syncs without any fuss.', 'Sleep tracking is surprisingly detailed and the vibration alarm wakes me without waking my partner.'],
    cons: ['Step count is far too generous, it counts arm movements while I cook.', 'The strap irritated my wrist after a few days and left a red mark.', 'The battery only lasts two days when notifications are on, not the week advertised.', 'Syncing with the app fails about half the time and I have to restart both.'],
  },
  'electronics/smarthome': {
    pros: ['Pairing took less than two minutes and now my voice assistant controls everything.', 'Light is bright and the colours look accurate, I use the schedule every evening.', 'Video is sharp and motion alerts reach my phone within seconds.', 'Compact enough not to block the neighbouring socket and the app is simple to use.'],
    cons: ['It drops off the Wi-Fi every few days and I have to re-pair it from scratch.', 'Motion alerts are triggered by shadows, so I get notifications all night.', 'The app is clunky and the schedule feature forgot my settings after an update.', 'Night vision is grainy and the camera runs warm to the touch.'],
  },
  'fashion/tops': {
    pros: ['The fabric is soft and breathable, perfect for the humid weather here.', 'Fits true to size and holds its shape after several washes.', 'Stitching is neat and the colour matches the photos nicely.', 'Thick enough not to be see-through yet still light for hot afternoons.'],
    cons: ['The fabric is thinner than it looks and slightly see-through when I wear a light colour.', 'Runs small, I normally wear M and had to send it back for an XL.', 'The colour faded after two washes and the collar started to curl.', 'A seam came loose near the sleeve after only a few wears.'],
  },
  'fashion/dresses': {
    pros: ['The fabric drapes beautifully and feels cool, ideal for events and brunch.', 'Length is perfect for my height and the waist sits exactly where it should.', 'The print looks as pretty in person as in the photos and it is fully lined.', 'Lots of compliments the first time I wore it, and it did not wrinkle in the bag.'],
    cons: ['The lining is itchy and the zipper snagged on the very first wear.', 'Much shorter than the size chart suggested, I had to wear shorts underneath.', 'The colour is duller than the product photo and the fabric looks cheap in daylight.', 'The tie keeps coming undone and the neckline gaps when I bend over.'],
  },
  'fashion/outerwear': {
    pros: ['Warm without being bulky and the zipper runs smoothly.', 'Kept me dry through a proper downpour and folds small enough for my bag.', 'The fit is roomy enough for a sweater underneath and the denim is heavy and well made.', 'Hood stays up in the wind and the pockets are deep enough for a phone.'],
    cons: ['Not actually waterproof, the shoulders were soaked after twenty minutes of rain.', 'The filling clumps at the bottom and left cold spots after one wash.', 'The zipper jammed within a month and the sleeves are shorter than expected.', 'The buttons are loose and the denim colour rubbed off on my white tee.'],
  },
  'fashion/bags': {
    pros: ['Plenty of room for my laptop and daily stuff, and the straps are well padded.', 'The zippers glide smoothly and the stitching looks strong at the stress points.', 'Light but sturdy, and the pockets are laid out in a really practical way.', 'The material feels solid and the colour looks just like the photo.'],
    cons: ['A strap seam started to fray after three weeks with a normal load.', 'Smaller than I imagined from the pictures, my laptop barely fits.', 'The zipper pull broke off and the inside smells strongly of glue.', 'The canvas is thin and the handle digs into my shoulder when it is full.'],
  },
  'fashion/eyewear': {
    pros: ['Lenses are clear with no distortion and the frame is light enough to forget I am wearing it.', 'Really reduces glare while driving, and the hard case is a nice extra.', 'The fit is comfortable behind the ears even after a full day at the screen.', 'The frame finish looks premium and has not scratched yet.'],
    cons: ['The lenses scratched within a week and the nose pads keep slipping.', 'The frame is too wide for my face and slides down when I look at my phone.', 'Polarization seems weak, I still squint in strong afternoon sun.', 'One hinge screw keeps loosening and the case feels very cheap.'],
  },
  'beauty/skincare': {
    pros: ['Absorbs quickly without feeling sticky and my skin looks calmer after a couple of weeks.', 'Gentle scent that fades quickly, and nothing stings even on my sensitive cheeks.', 'A little goes a long way, so the bottle lasts longer than I expected.', 'My skin feels soft and hydrated through a whole day in air conditioning.'],
    cons: ['Broke me out within three days, so I had to stop using it.', 'The scent is far stronger than I expected and lingered on my pillow.', 'Feels greasy and leaves a white cast that does not blend in.', 'The pump stopped working halfway through and I could not get the rest out.'],
  },
  'beauty/makeup': {
    pros: ['Pigment is rich and the colour lasts through a full workday without touch-ups.', 'Blends easily and looks natural, not cakey, even in photos.', 'Comfortable on the lips and the shade is just as pictured.', 'The wand separates lashes beautifully with no clumps.'],
    cons: ['The shade is noticeably different from the swatch photo, much more orange on me.', 'Smudged under my eyes by lunchtime and left racoon marks.', 'Dries out my lips and fades after an hour or two.', 'Lots of fallout while applying, and the palette arrived with a cracked pan.'],
  },
  'home/furniture': {
    pros: ['Assembly took about forty minutes with the included tools and it feels sturdy once built.', 'Looks just like the photos and the finish is smooth with no rough edges.', 'Comfortable for long working hours and the height adjustment is smooth.', 'Fits my small room perfectly and does not wobble even when fully loaded.'],
    cons: ['Several screw holes did not line up, so assembly turned into an evening of frustration.', 'It wobbles slightly on tile floors no matter how much I tighten the screws.', 'Arrived with a scratch on the top and the instructions were confusing.', 'Smaller than the listing implied and the seat cushion went flat in a month.'],
  },
  'home/lighting': {
    pros: ['Bright, even light that makes the room feel warm without hurting my eyes.', 'Installation was straightforward and the cord is long enough to reach the socket.', 'The base is heavy enough that it never tips and the finish looks lovely.', 'The touch control responds instantly and the dimming steps are smooth.'],
    cons: ['Flickers a little at low brightness, which gives me a headache in the evening.', 'The arm drifts down by itself and I keep having to readjust it.', 'The light is much dimmer than described and looks yellow, not warm white.', 'Arrived with a dented shade and the switch feels loose.'],
  },
  'home/bedding': {
    pros: ['Soft and cool against the skin, and still lovely after several washes.', 'Supports my neck well and I wake up without stiffness.', 'The stitching is neat and the zipper closure keeps the insert in place.', 'Good weight, calming to sleep under and no smell at all out of the box.'],
    cons: ['Strong chemical smell that did not go away after two washes.', 'Too firm for me and I woke up with a sore neck every morning.', 'The fabric pilled after the first wash and the colour is lighter than shown.', 'The beads clump to one side and the blanket feels uneven.'],
  },
  'home/decor': {
    pros: ['Looks even better in person, the glaze catches the light nicely.', 'Scent fills the room softly without being overpowering and burns evenly.', 'Quiet movement and easy to read from across the room.', 'Arrived well wrapped and adds a lovely touch to my shelf.'],
    cons: ['The scent is faint and the candle tunnelled down the middle after two burns.', 'Arrived with a hairline crack even though the box looked intact.', 'The clock ticks loudly enough to keep me awake at night.', 'The colour is far darker than the photos and the size is smaller than expected.'],
  },
  'sports/fitness': {
    pros: ['Really grippy and cushioned, I can do long sessions without sliding or sore knees.', 'Smooth adjustment and a solid feel, it replaced a whole rack of weights in my flat.', 'Lightweight and durable, and the carry bag makes it easy to pack for trips.', 'Does exactly what it should and the build feels better than the price suggests.'],
    cons: ['Strong rubber smell that lingered for days and the surface got slippery when sweaty.', 'The handle coating started peeling after two weeks of regular workouts.', 'One band snapped during a normal set, which could have been dangerous.', 'The adjustment mechanism sticks and the plates rattle during use.'],
  },
  'sports/outdoor': {
    pros: ['Pitched in ten minutes and stayed dry through an overnight storm.', 'Comfortable on the shoulders over a long trail and the hip belt takes the weight well.', 'Keeps drinks cold for a full day and the lid does not leak in my bag.', 'Warm enough for a cool night in the highlands and packs down small.'],
    cons: ['Condensation dripped inside the tent and a seam leaked in light rain.', 'The shoulder straps rubbed my neck raw by the second hour of hiking.', 'The lid leaks when tipped over and the paint chipped after a week.', 'The zipper snagged on the lining and the bag is not as warm as the rating says.'],
  },
  'sports/team-sports': {
    pros: ['Excellent grip even when my hands are sweaty, and it holds its bounce well.', 'Perfect size and weight for our weekly match, the stitching is clean.', 'Keeps its shape after weeks of rough courts and the surface feels great to touch.', 'Well inflated on arrival and the panels are evenly made.'],
    cons: ['The surface wore smooth after a couple of weeks on rough concrete.', 'Loses air overnight and I have to pump it before every session.', 'The seams started to split after a month of regular play.', 'Slightly smaller than regulation and the grip is slick when wet.'],
  },
  'groceries/beverages': {
    pros: ['The aroma when I open the pack is wonderful and the cup is smooth, not bitter.', 'Tastes fresh and balanced, clearly roasted recently and the pack seals well.', 'Not too sweet and it keeps well in the fridge, I order it every month now.', 'The leaves are whole and fragrant, and it brews a lovely clear cup.'],
    cons: ['The beans tasted stale and flat, nothing like the description.', 'Far too bitter, even after changing my grind and brewing time.', 'The bottle was already past half its shelf life when it arrived.', 'The pack was torn at the seal and half the leaves had spilled in the box.'],
  },
  'groceries/pantry': {
    pros: ['Great flavour and the texture holds up well after cooking.', 'Fresh and fragrant, a little goes a long way in the kitchen.', 'Crunchy, not too sweet, and the clusters are big and satisfying.', 'The jar arrived sealed and well wrapped, and it tastes just like the real thing.'],
    cons: ['The oil tastes flat and the bottle leaked a little in the box.', 'The pasta went mushy a minute after the recommended time.', 'Very sweet and the clusters were mostly crumbs at the bottom of the bag.', 'The expiry date was only a few weeks away when it arrived.'],
  },
  'groceries/fresh': {
    pros: ['Arrived fresh and firm, packed carefully with no bruises.', 'Sweet and flavourful, the best I have ordered online so far.', 'Ripened nicely over two days just as the seller said.', 'Good size, no blemishes, and the packing kept everything intact.'],
    cons: ['Several pieces were bruised or soft when the box arrived.', 'Not ripe at all and then went bad within a day, no in-between.', 'Smaller than the photos and a couple were already going off.', 'Tasted bland and watery, not worth the price.'],
  },
  'accessories/watches': {
    pros: ['The dial looks elegant and the strap is comfortable on my wrist all day.', 'Keeps accurate time and the glass has stayed scratch-free so far.', 'Backlight is clear in the dark and the buttons have a reassuring click.', 'Looks more expensive than it is and gets compliments at the office.'],
    cons: ['Loses a few minutes every week and I have to reset it constantly.', 'The strap is stiff and the buckle holes are poorly punched.', 'The glass scratched within days and the backlight is dim.', 'Battery died after two months and the case feels lighter than it looks.'],
  },
  'accessories/jewelry': {
    pros: ['Sparkles nicely without looking cheap, and I have worn it every day without any irritation.', 'The clasp is secure and the chain feels delicate yet strong.', 'Lightweight and comfortable, a lovely gift that arrived in a neat pouch.', 'The finish has not tarnished after weeks of wear and daily showers.'],
    cons: ['The plating started wearing off in two weeks and left my skin greenish.', 'The clasp is tiny and fiddly, and it came undone while I was walking.', 'Looks smaller than in the photos and the chain tangles easily.', 'Gave me an itchy rash behind the ears, so I cannot wear them.'],
  },
  'accessories/small-goods': {
    pros: ['The leather feels supple and smells nice, and the stitching is clean.', 'Slim enough for a front pocket yet holds all my cards comfortably.', 'The buckle is solid and the belt keeps its shape after months of use.', 'Looks great and develops character with daily use.'],
    cons: ['Strong chemical smell and the edges feel rough, it does not seem like real leather.', 'The card slots are too tight and the leather started cracking after a month.', 'The belt holes are uneven and the buckle scratches easily.', 'The stitching came apart at the corner within weeks.'],
  },
  'accessories/travel': {
    pros: ['The wheels glide quietly and the handle locks firmly at every height.', 'Fits within the airline carry-on limit and the shell survived rough handling.', 'Keeps my suitcase organised and the zippers run smoothly.', 'Supports my neck for the whole flight and the cover washes well.'],
    cons: ['A wheel cracked on the first trip and the handle wobbles from side to side.', 'The zipper split after a few uses and the shell scratches very easily.', 'The cubes are thinner than expected and the stitching frayed along one edge.', 'The pillow is too firm and flattened out after a couple of trips.'],
  },
};

/* Problems any parcel can have, regardless of the product. */
export const UNIVERSAL_CONS = [
  'Delivery took almost two weeks, much later than the estimate on the page.',
  'The box was crushed and dented when it reached me, thankfully the product inside was fine.',
  'The item is not quite as described in the listing, a couple of details are different.',
  'Customer service took days to reply and the answer did not really solve anything.',
  'The packaging was torn on arrival and looked like it had been opened before.',
  'Courier left it at the gate without any notification and it sat outside for hours.',
  'One accessory listed in the description was missing from the box.',
];

export const SELLER_REPLIES = [
  'Thank you for your feedback and we are sorry about this. Please message us with your order number and we will arrange a replacement.',
  'Sorry for the inconvenience. We have passed your comments to our packing team and would like to make it right, please contact us.',
  'We apologise for the experience. Send us a photo through chat and we will refund or exchange it right away.',
  'Thanks for letting us know. The courier delays last week were beyond our control, we have changed our logistics partner since then.',
  'We are sorry it did not meet expectations. Please reach out and we will help with a return at no cost to you.',
  'Terima kasih for the honest review. We have updated the product description so the details are clearer for future buyers.',
  'Apologies for the trouble. Our support team will contact you today to sort this out.',
];

export const OPENERS = {
  pos: ['Really happy with this one.', 'Mantap!', 'Exceeded my expectations.', 'Bought this on a friend\'s recommendation and no regrets.', 'Barang bagus, sesuai deskripsi.', 'Impressed so far.', 'Third purchase from this seller.', 'Arrived quickly and well packed.', 'Honestly a great find.', 'Ordered with low expectations, pleasantly surprised.'],
  mid: ['It is decent overall.', 'Mixed feelings about this one.', 'Not bad, not amazing.', 'Does the job but with some flaws.', 'Fair for the price, with caveats.', 'Okay purchase.'],
  neg: ['Disappointed.', 'Sayang sekali, not what I hoped for.', 'I wanted to like this.', 'Would not buy again.', 'Quality control needs work.', 'Not worth the money in my experience.', 'Had high hopes but they did not last.'],
};

export const CLOSERS = {
  pos: ['Would recommend to anyone looking for one.', 'Recommended seller, fast response too.', 'Will order again.', 'Definitely worth the price.', 'Good value, I bought a second one for my sister.', 'Five stars from me.', 'Very satisfied overall.'],
  mid: ['Fine if you set your expectations accordingly.', 'Would consider it again if the price drops.', 'Probably fine for casual use.', 'Hoping the next batch is better.'],
  neg: ['I would think twice before ordering.', 'Hopefully the seller improves this.', 'Sadly I am returning it.', 'Not recommended in my case.', 'I will look at other brands next time.'],
};

/* Gentle gripes for four-star reviews. */
export const MINOR_GRIPES = [
  'Only small complaint is that the box was bigger than it needed to be.',
  'I would have liked a couple more colour options.',
  'The instructions could be clearer, but I figured it out.',
  'Delivery was a day slower than promised, nothing serious.',
  'The price crept up a little after I bought it, but still fair.',
];

export const TITLES = {
  5: ['Great {t}', 'Worth every dollar', 'Exactly what I needed', 'Better than expected', 'Highly recommended', 'Very happy with it', 'Solid quality', 'Mantap, recommended', 'Love this {t}', 'Perfect for daily use'],
  4: ['Good {t}, minor issues', 'Pretty good overall', 'Good value', 'Happy with it', 'Nice, but not perfect', 'Does what it says', 'Solid choice'],
  3: ['Average {t}', 'It is okay', 'Mixed feelings', 'Fine for the price', 'Could be better', 'Decent, not great'],
  2: ['Disappointing', 'Not as described', 'Had problems', 'Below expectations', 'Poor quality control', 'Not impressed'],
  1: ['Do not recommend', 'Very disappointed', 'Would not buy again', 'Waste of money', 'Terrible experience', 'Not as advertised'],
};

export const FIRST_NAMES = ['Budi', 'Siti', 'Agus', 'Dewi', 'Rizky', 'Putri', 'Andi', 'Ayu', 'Eko', 'Rina', 'Fajar', 'Indah', 'Hendra', 'Maya', 'Bayu', 'Lestari', 'Dimas', 'Wulan', 'Yoga', 'Nur', 'Reza', 'Sari', 'Arif', 'Citra', 'Gilang', 'Anisa', 'Joko', 'Fitri', 'Taufik', 'Melati', 'Wahyu', 'Intan', 'Hadi', 'Rani', 'Ilham', 'Dian', 'Teguh', 'Mega', 'Surya', 'Nadia', 'Bagas', 'Laras', 'Irfan', 'Tiara', 'Yusuf', 'Aulia', 'Rudi', 'Salsa', 'Galih', 'Kartika'];
export const LAST_NAMES = ['Santoso', 'Wijaya', 'Pratama', 'Hidayat', 'Saputra', 'Lestari', 'Kusuma', 'Nugroho', 'Setiawan', 'Rahmawati', 'Susanto', 'Purnomo', 'Hakim', 'Utami', 'Wibowo', 'Siregar', 'Nasution', 'Simanjuntak', 'Lubis', 'Harahap', 'Gunawan', 'Halim', 'Permana', 'Firmansyah', 'Maulana', 'Anggraini', 'Syahputra', 'Ramadhan', 'Handayani', 'Kurniawan', 'Daulay', 'Tanjung', 'Yulianto', 'Susilo', 'Ardiansyah', 'Mahendra'];

/* Per product type: three things a happy buyer says it does and three things
 * an unhappy one says it does. Verb phrases ("it ...") so they wrap into
 * sentences; written for the type, so a phone case never "charges quickly". */
export const FRAGMENTS = {
  earbuds: [['lasts a full day of commuting on a single charge', 'pairs with my phone in seconds and never drops', 'stays in my ears during workouts'], ['loses connection whenever my phone is in a back pocket', 'hurts my ears after an hour', 'drains the battery in about four hours']],
  headphones: [['blocks out the office noise better than I expected', 'is comfortable even after four hours of calls', 'folds flat into the travel case'], ['clamps too tightly and gives me a headache', 'has an ANC hiss that never goes away', 'creaks at the hinge whenever I turn my head']],
  speaker: [['fills the whole room with clear sound and decent bass', 'survived a splash at the pool without a problem', 'keeps playing for a whole afternoon outside'], ['distorts once the volume goes past 70 percent', 'disconnects every time I walk into another room', 'has a battery that is nowhere near the advertised hours']],
  smartphone: [['takes sharp photos even in the evening', 'runs everyday apps smoothly with no lag', 'gets through a heavy day on one charge'], ['heats up whenever I record video', 'has a camera that struggles indoors', 'drains from 100 to 40 percent in one afternoon']],
  'phone-case': [['fits perfectly with every cutout lined up', 'survived a drop onto tiles without a scratch on the phone', 'has a grippy finish that does not slip out of my hand'], ['yellowed after a month in my pocket', 'is so tight that removing it takes two hands', 'has buttons that feel mushy and stiff']],
  'wireless-charger': [['starts charging the moment I put the phone down', 'stays cool even overnight', 'holds the phone steady with a non-slip surface'], ['only charges if the phone sits in exactly the right spot', 'gets uncomfortably warm after an hour', 'charges slower than my old cable did']],
  laptop: [['boots in seconds and handles a dozen tabs without a stutter', 'has a screen that is bright and sharp for daily work', 'lasts through a full day of classes on one charge'], ['runs hot and the fan gets loud under light load', 'has a battery that barely lasts four hours', 'arrived with a flickering screen edge']],
  keyboard: [['has a crisp, satisfying key feel for long typing sessions', 'connects over Bluetooth instantly after waking', 'has an even backlight and keycaps that look premium'], ['started double-typing on a few keys within a month', 'rattles on the space bar with every press', 'loses its wireless connection until I replug the receiver']],
  monitor: [['shows sharp, accurate colours straight out of the box', 'has a stand that adjusts smoothly and holds steady', 'is comfortable on the eyes during long work days'], ['has noticeable backlight bleed in the corners', 'arrived with a dead pixel near the edge', 'looks washed out until I spent an hour calibrating it']],
  mouse: [['tracks smoothly on my desk and even on a glass table', 'fits my hand comfortably through a whole workday', 'has quiet clicks and a battery that lasts for months'], ['double-clicks by itself after a few weeks', 'drifts across the screen when the battery runs low', 'has a scroll wheel that sticks and squeaks']],
  'action-camera': [['records sharp, steady footage even on a bumpy ride', 'shrugged off rain and splashes', 'is simple to mount on a helmet and bike'], ['runs out of battery after about forty minutes of recording', 'overheats and stops filming on warm days', 'has a door latch that feels too flimsy for water']],
  mirrorless: [['produces lovely colour and detail straight out of the camera', 'locks focus quickly on moving subjects', 'feels balanced and comfortable in the hand'], ['hunts for focus in low light', 'drains its battery after about 200 shots', 'has a menu system that is confusing to navigate']],
  tripod: [['stays rock steady even with a heavy camera on it', 'folds small enough to fit in my bag', 'extends and locks quickly with the leg clamps'], ['slowly sinks under the weight of my camera', 'has a leg lock that came loose within a few uses', 'wobbles when fully extended even on flat ground']],
  'smart-tv': [['has vivid colours and is bright enough for a sunny living room', 'connected to the Wi-Fi and apps in minutes', 'mounted flat on my wall with the bracket holes lining up'], ['is slow to open apps and freezes on the home screen', 'has backlight bleed in dark scenes', 'came with a remote that lost its pairing in two weeks']],
  soundbar: [['makes dialogue much clearer than the TV speakers', 'has a satisfying bass even without a subwoofer', 'connected to my TV with one HDMI cable'], ['cuts out when the TV switches inputs', 'sounds hollow at high volume', 'has a remote that barely responds']],
  projector: [['gives a bright, sharp picture in a dim room', 'focuses quickly and keeps the picture steady', 'is small enough to carry from room to room'], ['is too dim to use with any light on', 'has a fan that is loud enough to hear during quiet scenes', 'struggles to focus at the edges of the screen']],
  smartwatch: [['has a bright screen that stays readable in sunlight', 'delivers notifications instantly and syncs smoothly', 'gets through five days on a single charge'], ['counts steps while I am just cooking', 'has a strap that irritated my wrist', 'loses the connection to my phone every few hours']],
  'fitness-band': [['tracks my heart rate close to my phone app', 'lasts nearly two weeks per charge', 'is light enough to sleep in'], ['gives step counts that are far too generous', 'has a strap that cracked after a month', 'fails to sync with the app about half the time']],
  'smart-bulb': [['paired in under two minutes and obeys my voice assistant', 'is bright with colours that look accurate', 'dims smoothly with no flicker'], ['drops off the Wi-Fi every few days', 'flickers at low brightness', 'shows colours that are much dimmer than advertised']],
  'security-camera': [['has crisp video and reliable motion alerts', 'has clear night vision with little grain', 'was set up in five minutes with the app'], ['sends alerts for every passing shadow', 'goes offline overnight and needs a restart', 'has grainy night footage and runs warm']],
  'smart-plug': [['pairs easily and the schedules run on time', 'is compact enough not to block the next socket', 'has responded to voice commands every single time'], ['loses its Wi-Fi connection and needs re-pairing', 'forgot my schedules after an app update', 'clicks loudly every time it switches']],
  tshirt: [['feels soft and breathable in hot weather', 'keeps its shape after several washes', 'has a neckline that sits flat and neat'], ['is thinner than it looks and a bit see-through', 'ran small, I had to size up', 'faded after two washes']],
  hoodie: [['is thick and cosy without being heavy', 'has a roomy hood and a soft fleece lining', 'held its shape and colour after multiple washes'], ['pilled after the first wash', 'is far thinner than the photos suggest', 'has a drawstring that came out of the hood']],
  'button-shirt': [['has crisp fabric that looks smart for the office', 'fits well across the shoulders', 'needs almost no ironing'], ['has buttons that came loose within weeks', 'wrinkles badly after a few hours', 'has a collar that curls at the corners']],
  'summer-dress': [['is light and cool for hot afternoons', 'has a lovely print that looks just like the photos', 'is lined so nothing shows through'], ['is much shorter than the size chart suggests', 'has a zipper that snagged on the first wear', 'looks duller in daylight than the product photo']],
  'maxi-dress': [['flows beautifully when I walk', 'is the perfect length for my height', 'has a comfortable waist that stays put'], ['is too long and needed hemming', 'has a zipper that kept sticking', 'feels thin and clings to everything']],
  'wrap-dress': [['has an adjustable tie that suits my shape', 'drapes nicely and stays put through a day of events', 'has a neckline that does not gape'], ['keeps coming undone at the waist', 'has a neckline that gaps when I bend over', 'wrinkles badly in the bag']],
  'denim-jacket': [['is heavy, well-made denim that goes with everything', 'has deep pockets and sturdy buttons', 'has a great fit with room for a sweater'], ['rubbed dye onto my white t-shirt', 'has buttons that are already loose', 'has sleeves that are too short']],
  'puffer-jacket': [['keeps me warm in air-conditioned offices and cold trips', 'is light and packs down small', 'has a zipper that runs smoothly'], ['has filling that clumps at the bottom after a wash', 'is nowhere near as warm as the rating says', 'has a zipper that jammed in a month']],
  'rain-jacket': [['kept me dry through a proper downpour', 'has a hood that stays up in the wind', 'folds small into its own pocket'], ['soaked through at the shoulders in twenty minutes of rain', 'leaves me sweaty because it does not breathe', 'has a seam that started leaking']],
  backpack: [['has plenty of room for my laptop and daily things', 'has padded straps that stay comfortable when it is full', 'has zippers that glide without snagging'], ['has a strap seam that started fraying in weeks', 'is smaller than it looks in the photos', 'has a zipper pull that came off']],
  tote: [['holds groceries and a laptop without sagging', 'has a thick canvas that feels durable', 'has handles that sit comfortably on the shoulder'], ['has a handle seam that is coming apart', 'is thinner than it looked', 'has an inner pocket that is too small for a phone']],
  crossbody: [['has a strap that stays comfortable all day', 'has well-placed compartments for phone and cards', 'looks smart and goes with everything'], ['has a strap that keeps slipping', 'has a zipper that sticks at the corners', 'is too small for a regular phone']],
  sunglasses: [['has clear lenses with no distortion', 'cuts the glare while I drive', 'is light enough to forget I am wearing them'], ['scratched within a week', 'slips down my nose', 'has hinge screws that keep loosening']],
  'blue-light': [['reduces eye strain during long screen days', 'has a light frame that is comfortable behind the ears', 'has clear lenses with barely any tint'], ['has a frame too wide for my face', 'has lenses with annoying reflections', 'did not make a noticeable difference for my eyes']],
  serum: [['absorbs quickly without feeling sticky', 'left my skin calmer within two weeks', 'lasts a long time because a little goes a long way'], ['made me break out within three days', 'has a scent far stronger than expected', 'feels tacky and sits on top of the skin']],
  moisturizer: [['keeps my skin hydrated through a day in air conditioning', 'has a light texture that sinks in fast', 'has a gentle scent that fades quickly'], ['feels greasy and heavy on my skin', 'made my cheeks itch', 'has a jar that arrived with a loose seal']],
  sunscreen: [['has no white cast and works well under makeup', 'feels lightweight in humid weather', 'did not sting my eyes while I was out'], ['leaves a noticeable white cast on my skin', 'feels sticky and heavy in the heat', 'has a tube that leaked in my bag']],
  cleanser: [['lathers gently and rinses off cleanly', 'leaves my skin soft rather than tight', 'has a mild fragrance that I like'], ['left my skin dry and tight', 'stings if it gets near my eyes', 'has a pump that stopped working halfway']],
  lipstick: [['has rich colour in a single swipe', 'stays comfortable and lasts through lunch', 'has a shade that matches the swatch photo'], ['dries my lips and fades within two hours', 'has a shade much more orange than pictured', 'feels waxy and bleeds around the edges']],
  foundation: [['gives even coverage that still looks like skin', 'lasts through a long day in the heat', 'blends easily with a sponge'], ['has a shade noticeably darker than advertised', 'oxidises and turns orange by lunchtime', 'settles into lines and looks cakey']],
  mascara: [['gives volume and length without clumping', 'stays put through humid days', 'has a wand that separates lashes nicely'], ['smudges under my eyes by lunchtime', 'clumps badly after the first week', 'dries out within a month']],
  palette: [['has pigmented shades that blend easily', 'has a wearable mix of everyday and evening colours', 'has shades that look just like the photo'], ['has a lot of fallout when I apply it', 'arrived with a cracked pan', 'has shades that fade within a few hours']],
  'office-chair': [['has lumbar support that really eases my back', 'was easy to assemble and feels sturdy', 'has a seat that stays comfortable for long workdays'], ['has a seat cushion that went flat in a month', 'has armrests that wobble and squeak', 'sinks slowly after I sit for a while']],
  bookshelf: [['feels sturdy once built and holds a lot of books', 'looks just like the photos with a smooth finish', 'fits my small room perfectly'], ['has screw holes that do not line up', 'sways when it is fully loaded', 'arrived with a scratch on the side panel']],
  'coffee-table': [['is sturdy and has a smooth, easy-to-clean surface', 'looks lovely in the living room', 'went together in half an hour'], ['wobbles on my tile floor', 'is smaller than the listing implies', 'has a surface that scratched on day one']],
  desk: [['moves up and down smoothly and quietly', 'is stable even at standing height', 'has a roomy desktop with a clean finish'], ['wobbles at full height', 'has a motor that stopped responding after a month', 'came with confusing assembly instructions']],
  'desk-lamp': [['gives bright, even light that is easy on my eyes', 'has a touch control that responds instantly', 'has an arm that stays exactly where I put it'], ['flickers at low brightness', 'has an arm that drifts down', 'looks yellow instead of warm white']],
  'floor-lamp': [['lights up the corner of the room warmly', 'has a heavy base that never tips', 'is easy to assemble'], ['wobbles at the joint', 'is dimmer than I expected', 'has a switch that feels loose']],
  pendant: [['gives a warm glow over the dining table', 'was simple to install with the included hardware', 'has a cord of just the right length'], ['has a shade that arrived dented', 'is much dimmer than described', 'swings and rattles at the joint']],
  'duvet-set': [['feels soft and cool against the skin', 'has neat stitching and a zipper that holds', 'still looks great after several washes'], ['has a strong chemical smell', 'pilled after the first wash', 'is lighter in colour than shown']],
  pillow: [['supports my neck so I wake up without stiffness', 'has a cover that is soft and washable', 'kept its shape after a few weeks'], ['is too firm and gave me a sore neck', 'smelled strongly out of the box', 'went flat within a month']],
  'weighted-blanket': [['feels calming and helps me fall asleep faster', 'has beads that stay evenly spread', 'is soft with tidy stitching'], ['has beads that clump to one side', 'is too hot to sleep under', 'is lighter than the listed weight']],
  vase: [['has a lovely glaze that catches the light', 'is heavy enough to stay put with tall flowers', 'arrived well wrapped'], ['arrived with a hairline crack', 'is smaller than expected', 'leaks slightly at the base']],
  'wall-clock': [['is silent and easy to read from across the room', 'looks great on my wall', 'keeps accurate time'], ['ticks loudly enough to hear at night', 'loses a few minutes every week', 'has a face that is hard to read in dim light']],
  candle: [['fills the room with a soft scent', 'burns evenly down to the last bit', 'has a lovely jar to reuse'], ['has a faint scent that barely reaches across the room', 'tunnelled down the middle after two burns', 'smoked and blackened the jar']],
  dumbbells: [['changes weight smoothly and feels solid', 'replaced a whole rack of weights in my flat', 'has a comfortable knurled grip'], ['has plates that rattle during sets', 'has an adjustment dial that sticks', 'has a coating that peeled in two weeks']],
  'yoga-mat': [['grips well even when my hands get sweaty', 'has cushioning that is kind to my knees', 'rolls out flat from day one'], ['smelled strongly of rubber for days', 'got slippery when I sweated', 'started peeling at the edges']],
  bands: [['gives a good range of resistance for my workouts', 'has comfortable handles and a sturdy door anchor', 'packs neatly into the carry bag'], ['snapped during a normal set', 'rolls up my arm every time', 'lost its stretch after a few weeks']],
  'jump-rope': [['spins fast and smoothly with no tangling', 'has handles that stay comfortable', 'adjusts quickly to my height'], ['has a cable that kinks after a few sessions', 'has handles that spin loose', 'is too light for me to feel the rhythm']],
  tent: [['was up in ten minutes and stayed dry through a storm', 'has plenty of room for two people and bags', 'ventilates well on warm nights'], ['let condensation drip inside', 'leaked at a seam in light rain', 'has a pole that bent in moderate wind']],
  'hiking-pack': [['sits comfortably on the hips over a long trail', 'holds plenty with a smart pocket layout', 'came with a handy rain cover'], ['rubbed my shoulders raw by the second hour', 'has a zipper that snagged on the first trip', 'has a hip belt that slips']],
  'water-bottle': [['keeps drinks cold for a full day', 'does not leak even when it tips over in my bag', 'has a lid that is easy to open with one hand'], ['leaks when it is on its side', 'chipped its paint within a week', 'leaves a metallic taste in my water']],
  'sleeping-bag': [['kept me warm on a cold night in the highlands', 'packs down small', 'has a smooth zipper and soft lining'], ['is not as warm as the rating says', 'has a zipper that snags on the lining', 'is too narrow for me to turn over']],
  basketball: [['has excellent grip and a true bounce', 'holds its air for weeks', 'feels just right in my hands'], ['wore smooth after two weeks on concrete', 'loses air overnight', 'has a surface that is slick when wet']],
  'soccer-ball': [['has a true flight and a soft touch', 'kept its shape through rough fields', 'has clean, tight stitching'], ['lost its shape after a few matches', 'loses air every day', 'has seams that began to split']],
  volleyball: [['has a soft touch and a stable flight', 'has a grippy surface for serving', 'came well inflated'], ['has a panel that began to peel', 'feels harder than a regulation ball', 'loses air quickly']],
  'coffee-beans': [['smells wonderful the moment I open it', 'tastes fresh and balanced with no bitterness', 'was clearly roasted recently'], ['tasted stale and flat', 'was far too bitter however I prepared it', 'arrived with a torn seal']],
  'loose-tea': [['has whole, fragrant leaves and brews a clear cup', 'has a delicate flavour that does not turn bitter', 'comes in a pack that reseals well'], ['tasted dusty and faded', 'was mostly broken leaf and powder', 'arrived in a torn pouch']],
  'cold-brew': [['is smooth and not bitter at all', 'is not too sweet and keeps well in the fridge', 'has a strong coffee flavour even with ice'], ['was already close to its expiry date', 'tasted watery and sour', 'arrived with a leaking cap']],
  'olive-oil': [['has a fresh, grassy flavour that lifts salads', 'comes in a bottle that pours cleanly', 'has a peppery finish I really like'], ['tastes flat and almost rancid', 'leaked a little in the box', 'has a bottle without a proper pour spout']],
  pasta: [['holds a good bite after cooking', 'has a lovely wheat flavour and keeps the sauce well', 'cooks in exactly the time on the pack'], ['went mushy a minute past the recommended time', 'broke into pieces in the pack', 'tastes bland even with a good sauce']],
  honey: [['has a rich floral taste and a smooth texture', 'comes in a jar that arrived sealed and clean', 'is not overly sweet'], ['crystallised within a week', 'is thinner and sweeter than real honey', 'had a loose lid and a sticky box']],
  granola: [['is crunchy with large clusters', 'has just the right level of sweetness', 'stays fresh in the resealable bag'], ['was mostly crumbs at the bottom of the bag', 'is far too sweet', 'tasted a little stale']],
  apples: [['was crisp and sweet right out of the box', 'arrived with no bruises', 'is a good size for lunchboxes'], ['arrived bruised and soft', 'tasted mealy and bland', 'was smaller than the photos']],
  avocados: [['ripened nicely over two days', 'was creamy with no brown spots', 'was a good size and well packed'], ['was rock hard and then rotten within a day', 'had brown stringy flesh inside', 'was bruised from the journey']],
  tomatoes: [['has a real tomato flavour that is sweet and juicy', 'arrived firm and perfectly ripe', 'were well packed with no splits'], ['arrived split and soggy', 'tasted watery and bland', 'were already going soft']],
  'analog-watch': [['looks elegant and is comfortable on the wrist all day', 'keeps accurate time', 'has a glass that has stayed scratch-free'], ['loses minutes every week', 'has a stiff strap with poorly punched holes', 'has a crown that is hard to pull out']],
  'digital-watch': [['has a clear backlight and buttons that click nicely', 'has a battery that lasts for months', 'is light and sturdy for sports'], ['has a dim backlight', 'has buttons that stick', 'has a strap that cracked in weeks']],
  necklace: [['sparkles nicely without looking cheap', 'has a strong chain and a secure clasp', 'came in a neat gift pouch'], ['has plating that wore off in two weeks', 'has a clasp that came undone while I walked', 'tangles easily in its pouch']],
  bracelet: [['is lightweight and comfortable to wear every day', 'has a secure clasp', 'has a finish that has not tarnished'], ['left a green mark on my skin', 'has a clasp that is tiny and fiddly', 'is smaller than the photos']],
  earrings: [['are light and comfortable for all-day wear', 'did not irritate my sensitive ears', 'look just like the pictures'], ['gave me an itchy rash', 'lost a back within a week', 'are much smaller than the photos']],
  wallet: [['has soft leather that smells nice', 'has neat stitching and plenty of card slots', 'slips easily into a back pocket'], ['smells strongly of glue', 'has edges that feel rough', 'has a stitched corner that came apart']],
  'card-holder': [['is slim enough for a front pocket', 'holds my cards snugly and comes out easily', 'has leather that feels soft'], ['has slots that are too tight', 'started cracking after a month', 'has a stitched edge that came loose']],
  belt: [['has a solid buckle and sturdy leather', 'keeps its shape after months of use', 'fits well between the holes'], ['has uneven holes', 'has a buckle that scratches easily', 'cracked at the fold within weeks']],
  suitcase: [['rolls quietly on its spinner wheels', 'fits within carry-on limits and survived rough handling', 'has a handle that locks firmly'], ['has a wheel that cracked on the first trip', 'has a wobbly handle', 'has a zipper that split after a few uses']],
  'packing-cubes': [['keeps my suitcase organised', 'has zippers that run smoothly', 'compresses clothes well'], ['has stitching that frayed along one edge', 'has a thinner fabric than expected', 'has a zipper that got stuck']],
  'travel-pillow': [['supports my neck for a whole flight', 'has a cover that is soft and washes well', 'clips onto my luggage easily'], ['is too firm and flattened out after a few trips', 'has a cover that slips off', 'is too small to support my neck']],
};

/* Sentence frames that turn a fragment into a sentence. */
export const GOOD_FRAMES = [
  'I like that it {f}.', 'Truth is, it {f}.', 'What won me over is that it {f}.', 'It {f}, which is more than I expected for this price.',
  'In daily use it {f}.', 'Best part: it {f}.',
];
export const BAD_FRAMES = [
  'Unfortunately it {f}.', 'Sadly it {f}, which I did not expect.', 'After a short while it {f}.', 'The main problem is that it {f}.',
  'It {f}, and that ruined it for me.', 'I did not expect it to, but it {f}.',
];
