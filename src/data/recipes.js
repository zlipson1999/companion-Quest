// The kitchen shelf — a real cookbook, browsable and searchable.
//
// Deliberately NOT a calorie database. Nourish is check-in based because the
// game rewards showing up and eating well and never restriction or guilt, so
// the cookbook agrees with it: no macros, no targets, no red numbers. What each
// recipe carries instead is a time, a short ingredient list, steps you can
// follow while tired, and the Nourish check-in it honestly counts as.
//
// Everything here is written for this project. Cooking methods are common
// knowledge and dish styles belong to the cuisines that made them, but no text
// is lifted from anyone's book or app — the phrasing, the proportions and the
// ordering are ours, and they need to stay that way.
//
// TAGS are the taxonomy. A recipe carries as many as are true, and CATEGORIES
// are derived from them, so adding a category is a line here rather than a
// re-tagging pass over the whole file.

const R = (id, name, minutes, logAs, tags, blurb, ingredients, steps) => ({
  id, name, minutes, logAs, tags, blurb, ingredients, steps,
});

export const RECIPES = [
  // --- Breakfast -----------------------------------------------------------
  R('overnight-oats', 'Night-Before Oats', 5, 'prepped',
    ['breakfast', 'no-cook', 'batch', 'vegetarian', 'budget', 'high-carb'],
    'Made when you are not hungry, eaten when you have no time.',
    ['1/2 cup rolled oats', '2/3 cup milk or plant milk', '2 tbsp yoghurt',
     'Fruit, and something with crunch'],
    ['Oats, milk and yoghurt into a jar. Stir once.',
     'Fruit on top. Lid on. Fridge.',
     'Add the crunchy thing in the morning, not the night before.']),

  R('savoury-oats', 'Savoury Oats, Egg on Top', 12, 'balanced',
    ['breakfast', 'vegetarian', 'budget', 'quick-ish', 'high-protein'],
    'Oats are a grain. Treat them like rice and they stop being a dessert.',
    ['1/2 cup rolled oats', '1 cup stock', 'An egg', 'Spring onion, soy, sesame oil'],
    ['Simmer the oats in stock, stirring, until they go creamy — about six minutes.',
     'Fry or soft-boil the egg while that happens.',
     'Season the oats properly, egg on top, soy and sesame over it.']),

  R('shakshuka', 'One-Pan Eggs in Tomato', 25, 'balanced',
    ['breakfast', 'vegetarian', 'one-pan', 'middle-eastern', 'low-carb'],
    'Eggs poached in a spiced tomato base. Works for any meal of the day.',
    ['Onion, garlic, red pepper', 'Tin of tomatoes', 'Cumin, paprika, chilli',
     '2-4 eggs', 'Bread, feta, herbs'],
    ['Soften the onion and pepper slowly. Garlic and spices in for a minute.',
     'Tomatoes in. Simmer until it thickens and stops tasting raw.',
     'Make wells, crack the eggs in, lid on, low heat.',
     'Pull it off while the yolks still move. Herbs and feta over.']),

  R('yoghurt-bowl', 'Yoghurt Bowl With Intent', 4, 'produce',
    ['breakfast', 'no-cook', 'vegetarian', 'quick', 'high-protein'],
    'The trick is building it in layers instead of burying everything in honey.',
    ['Thick plain yoghurt', 'Fruit, some of it tart', 'Nuts or seeds',
     'A little honey or maple'],
    ['Yoghurt into a bowl, not a mountain — flat gives you more surface.',
     'Fruit over it, tart first.', 'Nuts last so they stay loud.',
     'Sweetener in a thin line, not a puddle.']),

  R('oat-pancakes', 'Banana Oat Pancakes', 15, 'prepped',
    ['breakfast', 'vegetarian', 'budget', 'high-carb'],
    'Three ingredients, no scales, and they hold together properly.',
    ['1 ripe banana', '2 eggs', '1/2 cup oats blitzed to flour', 'Pinch of salt'],
    ['Blend everything. Let it sit five minutes to thicken.',
     'Medium heat, small pancakes — big ones will not flip.',
     'Wait for bubbles across the whole surface before you turn them.']),

  R('congee', 'Rice Porridge', 45, 'balanced',
    ['breakfast', 'east-asian', 'budget', 'slow', 'high-carb'],
    'For a cold morning or a bad throat. Almost entirely unattended.',
    ['1/2 cup rice', '6 cups stock or water', 'Ginger, sliced',
     'Egg, spring onion, soy, white pepper'],
    ['Rice, stock and ginger into a pot. Bring up, then the lowest heat you have.',
     'Stir occasionally for forty minutes until the grains collapse.',
     'Season hard at the end. Egg stirred in, spring onion over.']),

  R('breakfast-burritos', 'Freezer Breakfast Burritos', 40, 'prepped',
    ['breakfast', 'batch', 'mexican', 'high-protein', 'meal-prep'],
    'Make eight on a Sunday, eat one a day and stop skipping breakfast.',
    ['8 tortillas', '10 eggs', 'Black beans, drained', 'Cheese, peppers, onion',
     'Salsa or hot sauce'],
    ['Cook the peppers and onion down. Scramble the eggs softly — they cook again later.',
     'Cool everything. Warm filling in a tortilla steams it soggy.',
     'Fill, fold the ends in, roll tight. Wrap each in foil.',
     'Freeze. Oven or pan from frozen; the microwave makes them wet.']),

  R('avocado-toast', 'Avocado Toast, Actually Seasoned', 7, 'produce',
    ['breakfast', 'vegetarian', 'quick', 'no-cook'],
    'The difference between good and pointless is acid and salt.',
    ['Good bread', 'A ripe avocado', 'Lemon or lime', 'Flaky salt, chilli, olive oil'],
    ['Toast the bread hard. Soft toast collapses.',
     'Mash the avocado with lemon and salt BEFORE it goes on. Season the fat.',
     'Pile it on, oil and chilli over the top.']),

  // --- Quick and no-cook ---------------------------------------------------
  R('actual-snack', 'Actual Snack', 3, 'produce',
    ['snack', 'no-cook', 'quick', 'vegetarian', 'budget'],
    'Assembled, not cooked. The alternative to standing in front of the fridge.',
    ['An apple or a pear', 'Cheese, nuts or nut butter', 'Salt'],
    ['Cut the fruit. Cutting it is the whole trick — whole fruit gets ignored.',
     'Put the fatty thing beside it so the snack actually holds you.',
     'Salt on the fruit. Trust this.']),

  R('tuna-beans', 'Tuna and White Bean', 6, 'balanced',
    ['quick', 'no-cook', 'seafood', 'high-protein', 'budget', 'mediterranean', 'low-carb'],
    'A store-cupboard lunch that does not taste like a store-cupboard lunch.',
    ['Tin of tuna in oil', 'Tin of white beans', 'Red onion, sliced thin',
     'Lemon, parsley, olive oil'],
    ['Rinse the beans. Soak the onion in the lemon juice for five minutes to take the bite out.',
     'Tuna in with its oil — that is the seasoning.',
     'Fold gently. Crushing the beans turns it to paste.']),

  R('hummus-plate', 'Hummus Plate', 8, 'produce',
    ['quick', 'no-cook', 'vegetarian', 'levantine', 'budget', 'snack'],
    'Lunch by assembly. Nothing to cook, nothing to wash.',
    ['Hummus', 'Cucumber, tomato, olives', 'Feta or a boiled egg',
     'Pitta or flatbread', 'Olive oil, sumac or paprika'],
    ['Spread the hummus wide with the back of a spoon and make a well in it.',
     'Oil in the well, spice over.', 'Everything else around the edge.']),

  R('cottage-bowl', 'Cottage Cheese Bowl', 4, 'produce',
    ['quick', 'no-cook', 'vegetarian', 'high-protein', 'low-carb', 'snack'],
    'Savoury, not sweet. It is a much better ingredient than its reputation.',
    ['Cottage cheese', 'Tomato and cucumber, chopped small', 'Olive oil, black pepper',
     'Everything-bagel seasoning or za’atar'],
    ['Cottage cheese in the bowl, pepper straight onto it.',
     'Vegetables over, then oil, then the seasoning.']),

  R('peanut-noodles', 'Cold Peanut Noodles', 12, 'balanced',
    ['quick', 'vegan', 'east-asian', 'batch', 'high-carb'],
    'Better on day two, which makes it a genuine lunchbox.',
    ['Noodles', '3 tbsp peanut butter', 'Soy, rice vinegar, a little sugar',
     'Garlic, chilli', 'Cucumber, spring onion, peanuts'],
    ['Cook the noodles, rinse them cold. Warm noodles seize the sauce.',
     'Whisk the sauce with a splash of hot water until it pours.',
     'Toss, then top with the raw crunchy things.']),

  R('chickpea-smash', 'Chickpea Smash Sandwich', 8, 'produce',
    ['quick', 'no-cook', 'vegan', 'budget', 'high-protein'],
    'The texture of a deli filling with none of the deli.',
    ['Tin of chickpeas', '2 tbsp tahini or vegan mayo', 'Lemon, mustard',
     'Celery, red onion, dill', 'Bread'],
    ['Smash the chickpeas with a fork — leave half of them whole.',
     'Everything else in, taste, and add more lemon than feels right.',
     'Pile it high; this filling collapses if you are polite about it.']),

  R('sardine-toast', 'Sardines on Toast', 6, 'balanced',
    ['quick', 'seafood', 'budget', 'high-protein', 'mediterranean'],
    'Cheap, fast, and genuinely one of the best things you can eat.',
    ['Tin of sardines', 'Sourdough or any real bread', 'Lemon, chilli flakes',
     'Parsley, red onion'],
    ['Toast the bread and rub it with a cut garlic clove if you have one.',
     'Sardines on, broken up but not mashed.',
     'Lemon, chilli, onion, parsley. Eat it standing up.']),

  R('caprese', 'Tomato and Mozzarella', 6, 'produce',
    ['quick', 'no-cook', 'vegetarian', 'italian', 'low-carb'],
    'Three ingredients means all three have to be good. Nowhere to hide.',
    ['Ripe tomatoes at room temperature', 'Mozzarella', 'Basil',
     'Best olive oil you own, flaky salt'],
    ['Salt the tomatoes and leave them five minutes. They will release juice.',
     'Tear the mozzarella rather than slicing it — more surface.',
     'Oil last, over everything, generously.']),

  // --- Bowls and salads ----------------------------------------------------
  R('trailbowl', 'Trailkeeper Bowl', 20, 'balanced',
    ['bowl', 'batch', 'budget', 'meal-prep', 'high-protein'],
    'The one to learn first. Any grain, any protein, whatever is in the drawer.',
    ['1 cup rice, couscous or quinoa', '2 eggs, a tin of beans, or leftover chicken',
     'Whatever vegetable is closest to turning', 'Olive oil, lemon, salt, something spicy'],
    ['Start the grain — it needs the longest and wants no attention.',
     'Cut the vegetable into pieces that cook in the time you have left.',
     'Get colour on the vegetable in a hot pan. Do not crowd it.',
     'Add the protein just to warm through.',
     'Grain in the bowl, everything on top, oil and lemon over it.']),

  R('burrito-bowl', 'Burrito Bowl', 25, 'balanced',
    ['bowl', 'mexican', 'batch', 'meal-prep', 'high-protein', 'high-carb'],
    'All the parts keep separately, so one cook covers four lunches.',
    ['Rice, cooked with lime and coriander', 'Black beans, warmed with cumin',
     'Chicken, mince or roasted squash', 'Corn, red onion, tomato',
     'Yoghurt or soured cream, hot sauce'],
    ['Cook the rice; stir lime juice and coriander through it off the heat.',
     'Warm the beans with cumin and a splash of their own liquid.',
     'Cook the protein hard so it takes colour.',
     'Build in sections, not stirred. Sauce at the table.']),

  R('greek-chickpea', 'Greek Salad With Chickpeas', 12, 'produce',
    ['salad', 'vegetarian', 'greek', 'mediterranean', 'no-cook', 'high-protein'],
    'The chickpeas turn a side salad into a lunch that holds you.',
    ['Cucumber, tomato, red onion, green pepper', 'Tin of chickpeas',
     'Feta, olives, oregano', 'Olive oil, red wine vinegar'],
    ['Cut everything into pieces you can get on one fork.',
     'Dress the vegetables first and let them sit.',
     'Feta on top in slabs, not crumbs. Oregano rubbed between your palms.']),

  R('soba-salad', 'Soba Noodle Salad', 15, 'produce',
    ['salad', 'vegan', 'japanese', 'batch', 'quick-ish'],
    'Cold noodles that do not go gluey, which is the usual failure.',
    ['Soba noodles', 'Cucumber, carrot, edamame', 'Soy, rice vinegar, sesame oil, ginger',
     'Sesame seeds, nori'],
    ['Cook the soba a minute less than the packet says.',
     'Rinse under cold water and keep rinsing until the water runs clear. This is the whole technique.',
     'Dress, then add the vegetables so they stay crisp.']),

  R('bulgur-herb', 'Herb and Bulgur Salad', 20, 'produce',
    ['salad', 'vegan', 'levantine', 'budget', 'batch'],
    'Mostly herbs with grain running through it, not the other way round.',
    ['Fine bulgur, soaked', 'Two big bunches of parsley, one of mint',
     'Tomato, spring onion', 'Lemon, olive oil, salt'],
    ['Cover the bulgur with boiling water and leave it while you chop.',
     'Chop the herbs finely but do not bruise them — sharp knife, no rocking.',
     'Squeeze the tomatoes lightly so their juice dresses it too.',
     'Lemon and oil last, taste, more lemon.']),

  R('warm-lentil', 'Warm Lentil Salad', 30, 'balanced',
    ['salad', 'vegetarian', 'french', 'batch', 'high-protein', 'budget'],
    'Lentils dressed while hot take on far more flavour. Cold ones just sit there.',
    ['Puy or green lentils', 'Carrot, celery, bay', 'Dijon, red wine vinegar, olive oil',
     'Feta or a soft-boiled egg, parsley'],
    ['Simmer the lentils with the vegetables and bay until just tender, not soft.',
     'Drain and dress them immediately while steaming.',
     'Egg or cheese on top, plenty of parsley.']),

  R('rice-egg-bowl', 'Rice Bowl, Jammy Egg', 12, 'balanced',
    ['bowl', 'vegetarian', 'japanese', 'quick-ish', 'budget'],
    'What to make when the answer is nothing. Rice, egg, seasoning, done.',
    ['Hot rice', '2 eggs', 'Soy, sesame oil, furikake or sesame seeds',
     'Spring onion, nori'],
    ['Eggs into boiling water for six and a half minutes exactly. Ice water after.',
     'Season the rice in the bowl — soy and sesame stirred through.',
     'Halve the eggs over it. Everything else on top.']),

  R('cauli-bowl', 'Roast Cauliflower Bowl', 35, 'balanced',
    ['bowl', 'vegan', 'middle-eastern', 'batch'],
    'Roast it far darker than looks sensible. That is where the flavour is.',
    ['A cauliflower, in small florets', 'Chickpeas, drained and dried',
     'Cumin, coriander, paprika', 'Tahini, lemon, garlic', 'Grain and herbs'],
    ['Very hot oven. Cauliflower and chickpeas in oil and spice, one layer, plenty of room.',
     'Roast until the edges are properly brown — 25 to 30 minutes, turning once.',
     'Loosen tahini with lemon and cold water until it pours.',
     'Over grain, sauce over everything.']),

  // --- Meat ----------------------------------------------------------------
  R('sheet-pan-chicken', 'Sheet-Pan Chicken and Veg', 40, 'balanced',
    ['meat', 'one-pan', 'batch', 'meal-prep', 'high-protein'],
    'One tray, one wash-up, four dinners. The workhorse.',
    ['Chicken thighs, bone in', 'Potatoes and any hard vegetable', 'Lemon, garlic',
     'Olive oil, paprika, thyme, salt'],
    ['Cut the vegetables so everything finishes together — potatoes small, courgette large.',
     'Toss in oil and spice. Chicken skin side up, on top, so it drips down.',
     'Hot oven, 35 minutes. Do not stir; you want contact with the tray.',
     'Lemon squeezed over while it is still hot.']),

  R('turkey-meatballs', 'Turkey Meatballs', 35, 'prepped',
    ['meat', 'batch', 'meal-prep', 'high-protein', 'italian'],
    'Lean mince goes dry unless you give it something to hold moisture.',
    ['500g turkey or chicken mince', 'Grated courgette, squeezed dry',
     'Breadcrumbs, egg, garlic, parmesan', 'Tomato sauce'],
    ['Mix everything with your hands, briefly. Overworking makes them bouncy.',
     'Wet hands, roll golf balls. Brown them in a pan for colour.',
     'Finish in the sauce for fifteen minutes on low.']),

  R('beef-broccoli', 'Beef and Broccoli', 20, 'balanced',
    ['meat', 'east-asian', 'quick-ish', 'high-protein'],
    'Faster than ordering it, and the beef comes out tender if you slice it right.',
    ['Steak or beef strips, sliced ACROSS the grain', 'Broccoli, blanched',
     'Soy, oyster sauce, cornflour, sugar', 'Garlic, ginger'],
    ['Toss the beef in a spoon of cornflour and soy. This is what keeps it soft.',
     'Screaming hot pan. Beef in one layer, ninety seconds, out.',
     'Aromatics, then broccoli, then sauce, then the beef back in at the very end.']),

  R('pork-larb', 'Larb-Style Pork Salad', 20, 'balanced',
    ['meat', 'thai', 'low-carb', 'quick-ish', 'high-protein'],
    'Hot, sour, salty and herby all at once. Eaten in lettuce cups.',
    ['Pork or chicken mince', 'Fish sauce, lime, chilli', 'Shallot, mint, coriander',
     'Toasted rice powder if you have it', 'Lettuce leaves'],
    ['Dry-fry the mince hard, breaking it up, until some of it crisps.',
     'Off the heat, dress with lime and fish sauce — more lime than you think.',
     'Herbs and shallot stirred through at the last second so they stay fresh.',
     'Spoon into lettuce.']),

  R('beef-ragu', 'Slow Beef Ragu', 180, 'prepped',
    ['meat', 'italian', 'slow', 'batch', 'meal-prep'],
    'Three hours, ten minutes of which are yours. Freezes perfectly.',
    ['Beef shin or chuck, in big pieces', 'Onion, carrot, celery, garlic',
     'Tin of tomatoes, tomato puree', 'Red wine, bay, stock'],
    ['Brown the beef properly in batches. Crowding it steams it and you lose the whole dish.',
     'Soften the vegetables in the same pot. Puree in, cook it out a minute.',
     'Wine, reduce by half. Tomatoes, stock, bay, beef back in.',
     'Lowest heat or a low oven, three hours, lid ajar. Shred it in the sauce.']),

  R('jerk-chicken', 'Jerk-Spiced Chicken', 45, 'balanced',
    ['meat', 'caribbean', 'high-protein', 'batch'],
    'Marinade does the work; the oven does the rest.',
    ['Chicken thighs', 'Scotch bonnet or chilli, spring onion, garlic, ginger',
     'Allspice, thyme, brown sugar', 'Lime, soy, oil'],
    ['Blitz everything except the chicken into a paste.',
     'Coat the chicken and leave it — an hour minimum, overnight is better.',
     'Hot oven or grill until the edges char. Char is the point.',
     'Rest it five minutes, lime over.']),

  R('shawarma-wrap', 'Spiced Chicken Wraps', 30, 'balanced',
    ['meat', 'levantine', 'high-protein', 'batch', 'meal-prep'],
    'Marinated thigh, blistered flatbread, sharp pickles. Build it yourself.',
    ['Chicken thighs, sliced', 'Yoghurt, garlic, lemon', 'Cumin, coriander, paprika, cinnamon',
     'Flatbreads, pickles, tomato, tahini sauce'],
    ['Marinate the chicken in the yoghurt and spice for as long as you have.',
     'Cook it hard in a dry hot pan so it takes colour rather than stewing.',
     'Warm the bread directly over a flame or in the dry pan.',
     'Build: sauce, chicken, salad, pickles. Pickles are not optional.']),

  R('steak-sweet-potato', 'Steak and Sweet Potato', 35, 'balanced',
    ['meat', 'high-protein', 'post-training', 'high-carb'],
    'For the evening after a hard session. Carbs are the point, not the enemy.',
    ['A steak, out of the fridge 30 minutes early', 'Two sweet potatoes',
     'Butter, garlic, thyme', 'Anything green'],
    ['Potatoes into a hot oven while you deal with the rest.',
     'Dry the steak. Salt it. Hot dry pan, do not move it.',
     'Turn once, then butter, garlic and thyme, spooning it over for a minute.',
     'Rest the steak as long as you cooked it. This is not optional.']),

  R('chicken-noodle', 'Chicken Noodle Soup', 40, 'balanced',
    ['soup', 'meat', 'budget', 'batch', 'slow'],
    'The one you make when someone is ill, including yourself.',
    ['Chicken thighs', 'Onion, carrot, celery', 'Stock, bay, peppercorns',
     'Noodles or small pasta', 'Parsley, lemon'],
    ['Simmer the chicken in the stock with the vegetables for 25 minutes.',
     'Lift the chicken out, shred it, put it back.',
     'Noodles in for the last few minutes only — they go to mush otherwise.',
     'Lemon at the end wakes the whole pot up.']),

  // --- Seafood -------------------------------------------------------------
  R('panfish', 'Fifteen-Minute Fish', 15, 'balanced',
    ['seafood', 'quick-ish', 'high-protein', 'low-carb', 'one-pan'],
    'The fastest real dinner there is, and almost impossible to overwork.',
    ['A fillet of whatever fish looked good', 'A bag of greens',
     'Half a lemon, butter or oil, salt', 'Bread, if you want it'],
    ['Dry the fish properly. Wet fish steams instead of browning.',
     'Salt it. Hot pan, oil, skin side down, and leave it alone.',
     'Flip once when the edges have gone opaque.',
     'Greens into the same pan off the heat — they will wilt in the residue.',
     'Lemon over everything.']),

  R('prawn-pasta', 'Garlic Prawn Pasta', 18, 'balanced',
    ['seafood', 'italian', 'quick-ish', 'high-carb'],
    'Emulsify the sauce with pasta water and it turns glossy instead of oily.',
    ['Spaghetti or linguine', 'Prawns', 'Garlic, chilli, olive oil',
     'Lemon, parsley', 'A ladle of pasta water'],
    ['Get the pasta going. Keep a mug of the water before you drain.',
     'Gentle heat, garlic and chilli in oil — brown garlic is bitter garlic.',
     'Prawns in for two minutes a side, no more.',
     'Pasta into the pan with a splash of its water, toss hard until it comes together.']),

  R('salmon-rice', 'Salmon Rice Bowl', 25, 'balanced',
    ['seafood', 'japanese', 'bowl', 'high-protein', 'batch'],
    'Works hot on the day and cold from the fridge the next.',
    ['Salmon fillet', 'Rice', 'Soy, mirin, sesame oil', 'Cucumber, avocado, spring onion',
     'Mayo and sriracha, mixed'],
    ['Roast or pan-fry the salmon; take it off while the middle is still translucent.',
     'Season the rice with a little soy and sesame.',
     'Flake the salmon over, everything else around it, sauce zigzagged over.']),

  R('fish-tacos', 'Fish Tacos', 25, 'balanced',
    ['seafood', 'mexican', 'high-protein'],
    'White fish, a sharp slaw and a lime. The slaw is what makes it work.',
    ['White fish fillets', 'Cabbage, shredded fine', 'Lime, yoghurt, coriander',
     'Cumin, paprika, chilli', 'Corn tortillas'],
    ['Dress the cabbage in lime and salt and leave it — it needs to soften slightly.',
     'Spice the fish and cook it hot and fast until it flakes.',
     'Char the tortillas directly on the flame or in a dry pan.',
     'Fish, slaw, sauce, more lime.']),

  R('mussels', 'Mussels in Cider', 20, 'balanced',
    ['seafood', 'french', 'quick-ish', 'high-protein'],
    'Cheap, fast, and it feels far more impressive than the effort it takes.',
    ['1kg mussels, scrubbed', 'Shallot, garlic', 'A bottle of dry cider',
     'Cream, parsley', 'Bread for the liquid'],
    ['Discard any mussel that stays open when you tap it.',
     'Soften the shallot, cider in, bring to a hard boil.',
     'Mussels in, lid on, three to four minutes until they open. Discard any that do not.',
     'Cream and parsley through the liquid. The liquid is the best part.']),

  R('sardine-pasta', 'Tinned Fish Pasta', 20, 'balanced',
    ['seafood', 'italian', 'budget', 'quick-ish', 'high-carb'],
    'One of the great cheap dinners. The tin is the sauce.',
    ['Pasta', 'Tin of sardines or mackerel in oil', 'Garlic, chilli, capers',
     'Breadcrumbs toasted in oil', 'Lemon, parsley'],
    ['Toast the breadcrumbs in oil until deep gold. Set aside — they are the texture.',
     'Garlic and chilli gently in oil, tinned fish in with its oil, break it up.',
     'Pasta and a splash of its water in, toss.',
     'Breadcrumbs over at the table, never stirred in.']),

  // --- Vegetarian ----------------------------------------------------------
  R('cupboard-soup', 'Cupboard Soup', 30, 'produce',
    ['soup', 'vegetarian', 'budget', 'batch', 'one-pan'],
    'For the evening when there is nothing in and you refuse to go out.',
    ['An onion, a carrot, a stick of celery', 'A tin of tomatoes and a tin of beans',
     'Stock, or water and something salty', 'A handful of pasta or rice'],
    ['Chop the onion, carrot and celery small. Sweat them slowly in oil.',
     'Tomatoes in, cook them down for a few minutes.',
     'Stock, beans and pasta. Simmer until the pasta is done.',
     'Taste it. It almost certainly needs more salt and something acidic.']),

  R('paneer-curry', 'Paneer and Pea Curry', 30, 'balanced',
    ['vegetarian', 'south-asian', 'high-protein'],
    'Fry the paneer first or it stays squeaky and sad.',
    ['Paneer, cubed', 'Onion, garlic, ginger', 'Tin of tomatoes', 'Frozen peas',
     'Garam masala, turmeric, cumin, cream or yoghurt'],
    ['Fry the paneer in oil until golden on at least two sides. Set aside.',
     'Onion down until properly soft — ten minutes, not three. Garlic, ginger, spice.',
     'Tomatoes in, cook until the oil separates out.',
     'Peas, paneer and cream in at the end just to heat through.']),

  R('halloumi-tray', 'Halloumi Traybake', 35, 'balanced',
    ['vegetarian', 'one-pan', 'mediterranean', 'high-protein'],
    'Everything on one tray, halloumi added late so it does not turn to rubber.',
    ['Halloumi, thick slices', 'Peppers, courgette, red onion, tomatoes',
     'Chickpeas', 'Oregano, olive oil, lemon, honey'],
    ['Vegetables and chickpeas in oil and oregano, hot oven, 20 minutes.',
     'Halloumi on top, another 10 until it blisters.',
     'Lemon and a thread of honey over it hot.']),

  R('mushroom-risotto', 'Mushroom Risotto', 40, 'mindful',
    ['vegetarian', 'italian', 'slow', 'high-carb'],
    'Twenty minutes of stirring. Genuinely good for the head.',
    ['Risotto rice', 'Mushrooms, plus dried porcini if possible', 'Onion, garlic, white wine',
     'Hot stock', 'Butter, parmesan'],
    ['Brown the mushrooms hard and separately first. Set aside.',
     'Soften the onion, rice in, toast it until the edges go clear.',
     'Wine, absorbed. Then stock a ladle at a time, stirring, for about eighteen minutes.',
     'Off the heat: butter and parmesan beaten in hard. That is what makes it creamy.']),

  R('egg-fried-rice', 'Egg Fried Rice', 12, 'balanced',
    ['vegetarian', 'east-asian', 'quick-ish', 'budget', 'high-carb'],
    'Needs cold rice. Fresh rice will always turn to porridge.',
    ['Cold cooked rice, at least a day old', '2-3 eggs', 'Spring onion, garlic, peas',
     'Soy, sesame oil, white pepper'],
    ['Break the rice up with your fingers before it goes near the pan.',
     'Scramble the egg in the hot pan, take it out while soft.',
     'Rice in, press it flat, leave it to catch. Toss and repeat.',
     'Egg back in, seasoning, spring onion off the heat.']),

  R('spinach-dal', 'Spinach Dal', 35, 'balanced',
    ['vegetarian', 'south-asian', 'budget', 'batch', 'high-protein'],
    'The cheapest good meal in this book. Better reheated.',
    ['1 cup red lentils', 'Onion, garlic, ginger, tomato', 'Turmeric, cumin, garam masala',
     'A bag of spinach', 'Ghee or oil, mustard seeds, dried chilli'],
    ['Lentils, turmeric and water on to simmer, skimming the foam.',
     'Meanwhile soften onion, then garlic, ginger and tomato into a thick base.',
     'Base into the lentils. Spinach in at the end to wilt.',
     'Bloom mustard seeds and chilli in hot ghee and pour it over at the table.']),

  R('veg-chili', 'Bean Chilli', 45, 'prepped',
    ['vegetarian', 'batch', 'meal-prep', 'mexican', 'budget', 'high-protein'],
    'Makes six portions, freezes flat, gets better for three days.',
    ['Two tins of beans, different kinds', 'Tin of tomatoes', 'Onion, pepper, garlic',
     'Cumin, smoked paprika, chipotle, oregano', 'Dark chocolate, a square'],
    ['Soften onion and pepper thoroughly. Spices in until they smell.',
     'Tomatoes and beans, plus a splash of water. Low and slow, 30 minutes.',
     'The chocolate at the end. It does not taste of chocolate; it makes it taste finished.',
     'Salt, then lime.']),

  R('frittata', 'Fridge Frittata', 25, 'prepped',
    ['vegetarian', 'one-pan', 'batch', 'high-protein', 'low-carb', 'budget'],
    'Purpose-built for leftovers. Cold slices are a lunchbox.',
    ['6-8 eggs', 'Cooked potato or pasta', 'Any cooked vegetable', 'Cheese, herbs'],
    ['Warm the fillings in an oven-proof pan so the eggs meet hot, not cold.',
     'Beaten seasoned eggs over. Low heat until the edges set.',
     'Under a hot grill for the last few minutes to set the top.',
     'Let it sit ten minutes. Hot frittata falls apart.']),

  R('aubergine-bake', 'Aubergine Bake', 60, 'balanced',
    ['vegetarian', 'italian', 'slow', 'batch'],
    'Roast the slices instead of frying them and it stops being a grease sponge.',
    ['2 aubergines, sliced', 'Tomato sauce', 'Mozzarella, parmesan', 'Basil, olive oil'],
    ['Salt the slices, wait twenty minutes, pat dry. This is the step people skip.',
     'Roast them in oil until collapsed and brown.',
     'Layer with sauce and cheese. Bake until it bubbles at the edges.',
     'Rest fifteen minutes or it will run everywhere.']),

  R('mac-veg', 'Macaroni With Hidden Veg', 30, 'balanced',
    ['vegetarian', 'batch', 'budget', 'high-carb'],
    'A cauliflower and squash sauce that behaves like cheese sauce.',
    ['Macaroni', 'Cauliflower and butternut, boiled soft', 'Cheddar, mustard, nutmeg',
     'Milk or the cooking water'],
    ['Boil the vegetables until falling apart, keep some water.',
     'Blend them with cheese, mustard and nutmeg into a pourable sauce.',
     'Fold through the pasta. Top with more cheese and grill it if you want a lid.']),

  // --- Vegan ---------------------------------------------------------------
  R('chana-masala', 'Chana Masala', 30, 'balanced',
    ['vegan', 'south-asian', 'budget', 'batch', 'high-protein'],
    'Store cupboard start to finish, and it tastes like it took much longer.',
    ['Two tins of chickpeas', 'Onion, garlic, ginger, tomatoes',
     'Cumin, coriander, garam masala, amchur or lemon', 'Chilli, coriander leaf'],
    ['Onion very dark and soft — this is the whole flavour base.',
     'Garlic, ginger, ground spices, thirty seconds.',
     'Tomatoes, cook until thick and glossy and the oil comes back out.',
     'Chickpeas plus a little of their liquid, simmer fifteen minutes, finish with lemon.']),

  R('peanut-stew', 'Peanut and Sweet Potato Stew', 45, 'balanced',
    ['vegan', 'west-african', 'batch', 'slow', 'budget'],
    'Rich, savoury and filling in a way most vegan stews are not.',
    ['Sweet potato, cubed', 'Onion, garlic, ginger, chilli', 'Tin of tomatoes',
     '4 tbsp peanut butter', 'Stock, spinach, peanuts'],
    ['Soften the aromatics, tomatoes in and cook down.',
     'Whisk the peanut butter with a little hot stock before it goes in, or it will clump.',
     'Sweet potato and the rest of the stock. Simmer until tender.',
     'Spinach through at the end, chopped peanuts over.']),

  R('miso-tofu', 'Miso Soup With Tofu', 15, 'produce',
    ['vegan', 'japanese', 'quick-ish', 'low-carb'],
    'Never boil it once the miso is in. That is the only rule.',
    ['Dashi or vegetable stock', '2 tbsp miso paste', 'Silken tofu, cubed',
     'Wakame, spring onion, mushrooms'],
    ['Warm the stock with the mushrooms. Wakame in to rehydrate.',
     'Tofu in gently — it will break if you stir hard.',
     'Slacken the miso in a ladle of the broth, then stir it back in OFF the heat.']),

  R('black-bean-tacos', 'Black Bean Tacos', 15, 'balanced',
    ['vegan', 'mexican', 'quick-ish', 'budget', 'high-protein'],
    'Fifteen minutes and you will not miss the meat.',
    ['Tin of black beans', 'Cumin, smoked paprika, chipotle', 'Onion, garlic',
     'Corn tortillas', 'Lime, avocado, coriander, pickled onion'],
    ['Fry onion and garlic, spices in until fragrant.',
     'Beans in with a splash of water, mash about a third of them so it holds together.',
     'Char the tortillas. Beans, avocado, pickle, lime.']),

  R('coconut-dal', 'Coconut Lentil Curry', 35, 'balanced',
    ['vegan', 'south-asian', 'batch', 'budget', 'high-protein'],
    'Freezes well, reheats better, costs almost nothing.',
    ['Red lentils', 'Tin of coconut milk', 'Onion, garlic, ginger',
     'Curry powder, turmeric, mustard seeds', 'Spinach, lime'],
    ['Bloom the mustard seeds in oil until they pop.',
     'Onion, garlic, ginger, then the ground spices.',
     'Lentils, coconut milk and water. Simmer 20 minutes until collapsed.',
     'Spinach and lime at the end. Salt properly.']),

  R('vegan-bolognese', 'Lentil Bolognese', 50, 'prepped',
    ['vegan', 'italian', 'batch', 'meal-prep', 'budget'],
    'Depth comes from cooking the base far longer than feels necessary.',
    ['Brown or puy lentils', 'Onion, carrot, celery, garlic', 'Tomato puree, tin of tomatoes',
     'Mushrooms, finely chopped', 'Soy sauce, bay, stock'],
    ['Chop the vegetables very small and cook them slowly for fifteen minutes.',
     'Mushrooms in, cook until they release and re-absorb their liquid.',
     'Puree in, cook it out. Then tomatoes, lentils, stock, bay.',
     'Forty minutes low. Soy sauce at the end for savouriness.']),

  R('silken-tofu-bowl', 'Cold Silken Tofu', 6, 'produce',
    ['vegan', 'east-asian', 'no-cook', 'quick', 'low-carb', 'high-protein'],
    'Barely a recipe. One of the best hot-weather lunches there is.',
    ['A block of silken tofu', 'Soy, black vinegar, sesame oil', 'Chilli crisp',
     'Spring onion, coriander, peanuts'],
    ['Tip the tofu out whole and let it drain a minute.',
     'Spoon the sauce over rather than mixing it in.',
     'Everything crunchy on top at the last moment.']),

  // --- Soups and stews -----------------------------------------------------
  R('minestrone', 'Minestrone', 45, 'produce',
    ['soup', 'vegetarian', 'italian', 'batch', 'budget'],
    'Whatever vegetables you have, plus beans and a rind of parmesan.',
    ['Onion, carrot, celery, courgette', 'Tin of tomatoes, tin of beans',
     'Small pasta', 'Parmesan rind, basil, olive oil'],
    ['Soften the hard vegetables slowly in oil for a good ten minutes.',
     'Tomatoes, beans, stock and the parmesan rind. Simmer half an hour.',
     'Pasta in at the end only.', 'Olive oil poured over each bowl, not into the pot.']),

  R('tomato-lentil', 'Tomato and Red Lentil Soup', 30, 'produce',
    ['soup', 'vegan', 'budget', 'batch', 'quick-ish'],
    'Thick enough to be dinner. Made almost entirely from tins.',
    ['Red lentils', 'Tin of tomatoes', 'Onion, garlic, carrot',
     'Cumin, smoked paprika', 'Stock, lemon'],
    ['Soften onion and carrot, spices in.',
     'Lentils, tomatoes and stock. Simmer 20 minutes.',
     'Blend half of it and leave the rest — texture matters.',
     'Lemon at the end. It will taste flat without it.']),

  R('pho-broth', 'Quick Noodle Broth', 25, 'balanced',
    ['soup', 'vietnamese', 'quick-ish', 'high-protein'],
    'Not a real pho — that takes a day. This is a good weeknight cheat.',
    ['Good stock', 'Star anise, cinnamon, charred ginger and onion',
     'Rice noodles', 'Thin-sliced beef or tofu', 'Herbs, lime, chilli, bean sprouts'],
    ['Char the ginger and onion directly on the heat until blackened in spots.',
     'Simmer them in the stock with the spices for twenty minutes, then strain.',
     'Noodles in the bowl, raw beef on top, boiling broth poured over cooks it.',
     'Herbs and lime at the table, by the handful.']),

  R('chorizo-beans', 'Chorizo and Bean Stew', 35, 'balanced',
    ['soup', 'meat', 'spanish', 'batch', 'one-pan', 'budget'],
    'Chorizo renders its own fat and seasons everything after it.',
    ['Cooking chorizo, sliced', 'Onion, garlic, red pepper', 'Tin of butter beans',
     'Tin of tomatoes, smoked paprika', 'Spinach or kale'],
    ['Render the chorizo slowly until the fat runs red. Do not rush this.',
     'Cook the vegetables in that fat.',
     'Tomatoes and beans, simmer twenty minutes until it thickens.',
     'Greens in to wilt.']),

  // --- Batch and meal prep -------------------------------------------------
  R('grain-base', 'A Pot of Grain', 30, 'prepped',
    ['batch', 'meal-prep', 'vegan', 'budget', 'high-carb'],
    'Not a meal. The thing that makes four meals possible.',
    ['2 cups rice, barley, farro or quinoa', 'Salted water or stock', 'Bay leaf',
     'Olive oil'],
    ['Cook it in stock rather than water. It costs nothing and changes everything.',
     'Spread it on a tray to cool fast — a warm sealed container goes sour.',
     'Toss with a little oil so it does not set into a brick.',
     'Fridge, four days. Freezes in portions.']),

  R('shredded-chicken', 'Shredded Chicken Base', 30, 'prepped',
    ['batch', 'meal-prep', 'meat', 'high-protein'],
    'Poach it, do not roast it. It stays soft enough to use cold all week.',
    ['Chicken breasts or thighs', 'Stock or salted water', 'Bay, peppercorns, garlic'],
    ['Cover with cold stock, bring barely to a simmer, then turn it OFF.',
     'Lid on, fifteen minutes in the residual heat. It will be perfectly done.',
     'Shred with two forks while warm; cold chicken shreds badly.',
     'Keep it in a little of the poaching liquid so it does not dry out.']),

  R('roast-tray-veg', 'A Tray of Roast Vegetables', 40, 'prepped',
    ['batch', 'meal-prep', 'vegan', 'budget', 'produce'],
    'Roast twice what you need. Cold roast vegetables improve everything.',
    ['Any hard vegetables — squash, carrot, onion, pepper, broccoli',
     'Olive oil, salt', 'Whole garlic cloves, unpeeled'],
    ['Cut everything to a similar size and give the tray real room.',
     'High heat. Crowding is the only way to fail at this.',
     'Do not turn them until they release from the tray on their own.',
     'The garlic cloves squeeze out as a paste. Use that in a dressing.']),

  R('freezer-soup-base', 'Soffritto for the Freezer', 25, 'prepped',
    ['batch', 'meal-prep', 'vegan', 'budget'],
    'Twenty-five minutes now buys you a ten-minute dinner four times.',
    ['4 onions, 4 carrots, 4 celery sticks', 'Olive oil', 'Salt'],
    ['Chop everything very small, or blitz it in short pulses.',
     'Cook it in plenty of oil on a low heat for twenty minutes until sweet and collapsed.',
     'Cool, then freeze in flat portions.',
     'Straight from frozen into a pan is the start of soup, ragu or stew.']),

  // --- Snacks and sweets ---------------------------------------------------
  R('yoghurt-bark', 'Frozen Yoghurt Bark', 10, 'produce',
    ['snack', 'sweet', 'vegetarian', 'no-cook', 'batch', 'high-protein'],
    'Ten minutes of work, then the freezer does it. Keeps for weeks.',
    ['Thick yoghurt', 'A little honey or maple', 'Berries, chopped',
     'Nuts, dark chocolate'],
    ['Sweeten the yoghurt lightly and spread it on baking paper, about a centimetre thick.',
     'Press the toppings in rather than scattering them on.',
     'Freeze four hours. Snap into shards. Keep it frozen.']),

  R('date-bites', 'Date and Nut Bites', 15, 'produce',
    ['snack', 'sweet', 'vegan', 'no-cook', 'batch', 'budget'],
    'Costs a fraction of the bought version and tastes considerably better.',
    ['Medjool dates, stones out', 'Nuts — almonds, cashews, whatever',
     'Cocoa, vanilla, salt', 'Oats if the mix is too wet'],
    ['Blitz the nuts first, to rubble, not powder.',
     'Dates in, blitz until it balls up around the blade.',
     'Salt matters here more than the sweetness. Roll into balls, chill.']),

  R('oat-bars', 'Tray of Oat Bars', 35, 'prepped',
    ['snack', 'sweet', 'vegetarian', 'batch', 'budget', 'high-carb'],
    'Portable, cheap, and they survive being sat on in a bag.',
    ['3 cups oats', 'Banana or apple sauce', 'Peanut butter, honey',
     'Seeds, dried fruit, cinnamon, salt'],
    ['Warm the peanut butter and honey together so they pour.',
     'Mix everything hard. It should look barely wet enough.',
     'Press into a lined tin FIRMLY — loose pressing is why bars crumble.',
     'Bake 20 minutes, cool completely IN the tin, then cut.']),

  R('chia-pudding', 'Chocolate Chia Pudding', 5, 'produce',
    ['snack', 'sweet', 'vegan', 'no-cook', 'batch', 'quick'],
    'Five minutes at night, dessert in the fridge for three days.',
    ['3 tbsp chia seeds', '1 cup milk or plant milk', '1 tbsp cocoa',
     'Maple, vanilla, salt'],
    ['Whisk everything, then whisk again after ten minutes. The second whisk stops it clumping.',
     'Fridge overnight.', 'Fruit or nuts on top only when you serve it.']),

  R('popcorn', 'Popcorn, Done Properly', 8, 'mindful',
    ['snack', 'vegan', 'quick', 'budget'],
    'Made on the hob it is a genuinely good snack. From a bag it is not.',
    ['1/3 cup popcorn kernels', 'Oil with a high smoke point', 'Fine salt',
     'Nutritional yeast, smoked paprika or cinnamon'],
    ['Three kernels in the hot oil with the lid on. When they pop, the oil is ready.',
     'Rest of the kernels in, lid on, shake the pan every few seconds.',
     'Off the heat when the pops are two seconds apart.',
     'Seasoning while it is still steaming, or nothing will stick.']),

  R('rice-cakes', 'Rice Cakes, Three Ways', 4, 'produce',
    ['snack', 'quick', 'no-cook', 'vegetarian', 'budget'],
    'The base is boring on purpose. What goes on it is the point.',
    ['Rice cakes', 'Nut butter and banana and salt',
     'Cottage cheese and tomato and pepper', 'Avocado and chilli and lime'],
    ['Pick one combination and commit — mixing them is how it gets sad.',
     'Something fatty, something fresh, something sharp. Every time.',
     'Salt regardless of which one.']),

  // --- Recovery and high carb ----------------------------------------------
  R('recovery-plate', 'Recovery Plate', 25, 'balanced',
    ['post-training', 'high-carb', 'high-protein', 'one-pan'],
    'For the evening after a hard session. Carbs are the point, not the enemy.',
    ['Two potatoes or a large sweet potato', 'A palm-sized piece of protein',
     'Yoghurt, lemon and herbs, stirred together', 'Anything green'],
    ['Potatoes into a hot oven, cut side down, while you deal with the rest.',
     'Cook the protein simply. Salt, heat, patience.',
     'Stir the yoghurt sauce. It takes a minute and makes the plate.',
     'Green thing raw or barely cooked, for texture.']),

  R('sweet-potato-cottage', 'Sweet Potato and Cottage Cheese', 50, 'balanced',
    ['post-training', 'high-carb', 'high-protein', 'vegetarian', 'budget'],
    'Unglamorous and extremely effective after a long run.',
    ['A large sweet potato', 'Cottage cheese', 'Black pepper, chilli, chives',
     'Olive oil'],
    ['Bake it whole at high heat until the skin is papery and it gives completely — 45 minutes.',
     'Split it, fork the inside up to make room.',
     'Cottage cheese in while it is hot, oil, pepper, chives.']),

  R('pasta-peas', 'Pasta With Peas and Ham', 15, 'balanced',
    ['high-carb', 'quick-ish', 'meat', 'budget', 'italian'],
    'A five-ingredient dinner that tastes like it has a sauce recipe behind it.',
    ['Pasta', 'Frozen peas', 'Ham, bacon or pancetta', 'Butter, parmesan, black pepper',
     'Pasta water'],
    ['Crisp the ham in butter.',
     'Peas straight from frozen into the pan with a ladle of pasta water.',
     'Pasta in, parmesan, and toss hard until the water and cheese make a sauce.',
     'More pepper than seems reasonable.']),

  R('rice-pudding', 'Stovetop Rice Pudding', 40, 'mindful',
    ['sweet', 'vegetarian', 'slow', 'budget', 'high-carb'],
    'Stirring something slowly is the point as much as eating it.',
    ['1/2 cup pudding or short-grain rice', '3 cups milk', 'Sugar, vanilla, salt',
     'Cinnamon, jam or fruit'],
    ['Rice, milk, a pinch of salt on a low heat.',
     'Stir often for about thirty-five minutes. It thickens all at once near the end.',
     'Sugar and vanilla only at the end — sugar early stops the rice softening.']),
];

// --- Taxonomy --------------------------------------------------------------
//
// Categories are DERIVED from tags rather than stored per recipe, so a new one
// is a line here instead of a pass over every entry. Counts come out of the
// same predicate the list uses, which means the number on the row can never
// disagree with what is behind it.

// `logAs` is a contract with the Nourish module: it must name one of that
// module's action ids or the log silently lands on the wrong check-in. Cheap to
// assert here, and it fails at import rather than under someone's thumb.
export const LOG_ACTIONS = ['balanced', 'produce', 'mindful', 'prepped'];

const wrongLog = RECIPES.filter((r) => !LOG_ACTIONS.includes(r.logAs));
if (wrongLog.length) {
  throw new Error(
    `recipes.js: unknown logAs on ${wrongLog.map((r) => r.id).join(', ')} — ` +
    `must be one of ${LOG_ACTIONS.join(', ')}`
  );
}

export const CATEGORIES = [
  { id: 'all', name: 'All Recipes', color: '#C89255', match: () => true },
  { id: 'quick', name: 'Quick & Easy', color: '#8C7BD8', match: (r) => r.minutes <= 15 },
  { id: 'breakfast', name: 'Breakfast', color: '#EB8B44', match: (r) => r.tags.includes('breakfast') },
  { id: 'meal-prep', name: 'Meal Prep', color: '#4F8A62', match: (r) => r.tags.includes('meal-prep') || r.tags.includes('batch') },
  { id: 'vegetarian', name: 'Vegetarian', color: '#5FA67A', match: (r) => r.tags.includes('vegetarian') || r.tags.includes('vegan') },
  { id: 'vegan', name: 'Vegan', color: '#91BD69', match: (r) => r.tags.includes('vegan') },
  { id: 'high-protein', name: 'High Protein', color: '#C65338', match: (r) => r.tags.includes('high-protein') },
  { id: 'low-carb', name: 'Low Carb', color: '#67A9B5', match: (r) => r.tags.includes('low-carb') },
  { id: 'high-carb', name: 'Fuel & Carbs', color: '#FFD078', match: (r) => r.tags.includes('high-carb') || r.tags.includes('post-training') },
  { id: 'meat', name: 'Meat', color: '#9A6843', match: (r) => r.tags.includes('meat') },
  { id: 'seafood', name: 'Seafood', color: '#327092', match: (r) => r.tags.includes('seafood') },
  { id: 'soup', name: 'Soups & Stews', color: '#7D302C', match: (r) => r.tags.includes('soup') },
  { id: 'bowl', name: 'Bowls & Salads', color: '#276451', match: (r) => r.tags.includes('bowl') || r.tags.includes('salad') },
  { id: 'snack', name: 'Snacks & Sweets', color: '#D98BA6', match: (r) => r.tags.includes('snack') || r.tags.includes('sweet') },
  { id: 'one-pan', name: 'One Pan', color: '#68462F', match: (r) => r.tags.includes('one-pan') },
  { id: 'no-cook', name: 'No Cook', color: '#B9DDD2', match: (r) => r.tags.includes('no-cook') },
  { id: 'budget', name: 'Budget', color: '#91BD69', match: (r) => r.tags.includes('budget') },
  { id: 'world', name: 'Around the World', color: '#183B56', match: (r) => r.tags.some((t) => CUISINES.includes(t)) },
];

// Cuisines are tags like any other; listed so the world category and the
// per-recipe origin line both read from one place.
export const CUISINES = [
  'italian', 'mexican', 'east-asian', 'south-asian', 'middle-eastern', 'levantine',
  'japanese', 'thai', 'vietnamese', 'caribbean', 'west-african', 'mediterranean',
  'greek', 'french', 'spanish',
];

const CUISINE_NAMES = {
  italian: 'Italian', mexican: 'Mexican', 'east-asian': 'East Asian',
  'south-asian': 'South Asian', 'middle-eastern': 'Middle Eastern',
  levantine: 'Levantine', japanese: 'Japanese', thai: 'Thai',
  vietnamese: 'Vietnamese', caribbean: 'Caribbean', 'west-african': 'West African',
  mediterranean: 'Mediterranean', greek: 'Greek', french: 'French', spanish: 'Spanish',
};

export function cuisineOf(recipe) {
  const tag = recipe.tags.find((t) => CUISINES.includes(t));
  return tag ? CUISINE_NAMES[tag] : null;
}

export function recipesIn(categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return RECIPES;
  return RECIPES.filter(cat.match);
}

export function countIn(categoryId) {
  return recipesIn(categoryId).length;
}

// Name, blurb, tag or ingredient. Searching ingredients is the point — "what
// can I do with a tin of chickpeas" is the question people actually have.
export function searchRecipes(query, pool = RECIPES) {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.blurb.toLowerCase().includes(q) ||
    r.tags.some((t) => t.includes(q)) ||
    r.ingredients.some((i) => i.toLowerCase().includes(q))
  );
}

export function getRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export default RECIPES;
