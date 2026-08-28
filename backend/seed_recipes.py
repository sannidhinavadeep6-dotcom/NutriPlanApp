"""NutriPlan — demo recipe library (100 recipes: South Indian focus + North classics).
Format: (name, servings, [(food_key, qty, unit), ...], steps)
All ingredients reference the global food database keys."""

RECIPES_100 = [
    # ---------------- the original 8 (keep first — the weekly plan references them) ----------------
    ("Overnight Oats with Banana", 1, [
        ("f068", 50, "g"), ("f101", 200, "ml"), ("f162", 1, "tbsp"),
        ("f002", 1, "piece"), ("f187", 1, "tsp"), ("f155", 8, "piece"),
    ], "Soak oats, milk, chia seeds and honey in a jar overnight.\nTop with sliced banana.\nGarnish with almonds before serving."),
    ("Grilled Chicken & Veggie Bowl", 2, [
        ("f120", 300, "g"), ("f061", 2, "cup"), ("f025", 150, "g"),
        ("f029", 1, "piece"), ("f181", 1.5, "tbsp"), ("f200", 0.5, "tsp"), ("f201", 0.25, "tsp"),
    ], "Grill seasoned chicken until done.\nSteam broccoli, chop capsicum.\nServe over brown rice with olive oil."),
    ("Paneer Butter Masala", 3, [
        ("f104", 225, "g"), ("f105", 2, "tbsp"), ("f110", 3, "tbsp"),
        ("f021", 3, "piece"), ("f020", 2, "piece"), ("f039", 4, "clove"),
        ("f040", 1, "tbsp"), ("f157", 25, "g"), ("f184", 1, "tsp"),
        ("f206", 1, "tsp"), ("f203", 1, "tsp"), ("f200", 1, "tsp"),
    ], "Blend boiled tomatoes with cashews, onion, garlic and ginger.\nCook the puree in butter with spices for 10 minutes.\nAdd cream and paneer; simmer 5 minutes."),
    ("Moong Dal Tadka", 3, [
        ("f142", 200, "g"), ("f220", 700, "ml"), ("f106", 1.5, "tbsp"),
        ("f205", 1, "tsp"), ("f020", 1, "piece"), ("f021", 1, "piece"),
        ("f041", 2, "piece"), ("f202", 0.5, "tsp"), ("f200", 1.5, "tsp"),
        ("f042", 2, "tbsp"),
    ], "Pressure cook dal with turmeric and salt.\nWhisk until creamy.\nPour ghee-cumin-onion tadka over the dal."),
    ("Fluffy Egg-White Omelette", 1, [
        ("f112", 3, "piece"), ("f111", 1, "piece"), ("f020", 0.5, "piece"),
        ("f029", 0.5, "piece"), ("f027", 30, "g"), ("f181", 0.5, "tbsp"),
        ("f200", 0.25, "tsp"), ("f201", 1, "pinch"),
    ], "Whisk eggs with salt and pepper until frothy.\nSaute onion, capsicum and spinach.\nPour eggs over; cook low, fold and serve."),
    ("Greek Yogurt Berry Bowl", 1, [
        ("f103", 200, "g"), ("f007", 1, "cup"), ("f008", 0.5, "cup"),
        ("f187", 1, "tsp"), ("f156", 15, "g"),
    ], "Spoon yogurt into a bowl.\nTop with berries and walnuts.\nDrizzle honey."),
    ("Rajma (Kidney Bean Curry)", 4, [
        ("f148", 250, "g"), ("f220", 900, "ml"), ("f182", 2, "tbsp"),
        ("f020", 2, "piece"), ("f021", 2, "piece"), ("f039", 4, "clove"),
        ("f040", 1, "tbsp"), ("f205", 1, "tsp"), ("f204", 2, "tsp"),
        ("f202", 0.5, "tsp"), ("f206", 1, "tsp"), ("f203", 1, "tsp"), ("f200", 2, "tsp"),
    ], "Soak rajma overnight and pressure cook.\nFry onion, garlic, ginger; add tomatoes and spices.\nAdd rajma; simmer 20 minutes."),
    ("Tofu Veg Stir-Fry", 2, [
        ("f154", 250, "g"), ("f024", 1, "piece"), ("f028", 150, "g"),
        ("f029", 1, "piece"), ("f039", 2, "clove"), ("f211", 1.5, "tbsp"), ("f181", 1, "tbsp"),
    ], "Pan-fry tofu cubes until golden.\nStir-fry garlic and vegetables on high heat.\nAdd soy sauce and tofu; toss."),

    # ---------------- SOUTH INDIAN TIFFINS ----------------
    ("Classic Idli", 4, [
        ("f063", 200, "g"), ("f147", 60, "g"), ("f200", 1, "tsp"),
    ], "Soak rice and urad dal separately for 5 hours.\nGrind together to a smooth batter and ferment overnight.\nSteam in idli plates for 10 minutes."),
    ("Medu Vada", 4, [
        ("f147", 200, "g"), ("f020", 1, "piece"), ("f041", 3, "piece"),
        ("f040", 1, "tbsp"), ("f200", 1, "tsp"), ("f180", 40, "ml"),   # absorbed oil while deep frying
    ], "Soak urad dal 3 hours; grind thick and fluffy.\nMix onion, green chili, ginger and salt.\nShape donuts and deep fry until golden."),
    ("Masala Dosa", 3, [
        ("f063", 250, "g"), ("f147", 60, "g"), ("f022", 3, "piece"),
        ("f020", 1, "piece"), ("f202", 0.25, "tsp"), ("f180", 3, "tbsp"), ("f200", 1, "tsp"),
    ], "Ferment rice-urad batter overnight.\nMake potato masala: temper turmeric with onion and mashed potato.\nSpread thin dosa, add masala, fold and serve."),
    ("Rava Dosa", 3, [
        ("f084", 150, "g"), ("f083", 50, "g"), ("f205", 1, "tsp"),
        ("f041", 2, "piece"), ("f020", 0.5, "piece"), ("f180", 3, "tbsp"), ("f200", 1, "tsp"),
    ], "Whisk rava, rice flour, cumin, chili and salt into a thin batter; rest 20 minutes.\nPour a lace-like layer on a hot tawa.\nDrizzle oil, crisp and fold."),
    ("Pesarattu (Green Moong Dosa)", 3, [
        ("f142", 200, "g"), ("f041", 2, "piece"), ("f040", 1, "tbsp"),
        ("f020", 0.5, "piece"), ("f200", 1, "tsp"), ("f180", 2, "tbsp"),
    ], "Soak moong dal 3 hours; grind with chili, ginger and salt.\nSpread like a dosa on a hot pan.\nTop with onion; cook both sides."),
    ("Rava Upma", 2, [
        ("f084", 150, "g"), ("f020", 1, "piece"), ("f032", 50, "g"),
        ("f159", 25, "g"), ("f106", 2, "tbsp"), ("f200", 1, "tsp"), ("f220", 400, "ml"),
    ], "Roast rava until aromatic.\nTemper ghee with peanuts, onion and peas; add boiling water.\nStir in rava; cook until fluffy."),
    ("Ven Pongal", 3, [
        ("f063", 100, "g"), ("f142", 50, "g"), ("f106", 3, "tbsp"),
        ("f201", 1, "tsp"), ("f205", 1, "tsp"), ("f157", 20, "g"), ("f200", 1.5, "tsp"),
    ], "Roast rice and moong lightly; pressure cook soft.\nTemper ghee with pepper, cumin and cashews.\nMash everything together with salt."),
    ("Onion Tomato Uttapam", 3, [
        ("f063", 200, "g"), ("f147", 50, "g"), ("f020", 1, "piece"),
        ("f021", 1, "piece"), ("f029", 0.5, "piece"), ("f041", 2, "piece"), ("f180", 2, "tbsp"),
    ], "Ferment rice-urad batter overnight.\nPour a thick pancake; press onion, tomato, capsicum and chili on top.\nFlip and cook both sides."),
    ("Kerala Appam", 3, [
        ("f063", 200, "g"), ("f165", 30, "g"), ("f184", 1, "tsp"),
        ("f101", 100, "ml"), ("f200", 0.5, "tsp"),
    ], "Grind soaked rice with coconut into a smooth batter.\nFerment overnight; add salt and a little milk.\nSwirl on an appam pan for lace edges and soft center."),
    ("Poori Potato Masala", 3, [
        ("f080", 200, "g"), ("f022", 3, "piece"), ("f020", 1, "piece"),
        ("f202", 0.25, "tsp"), ("f180", 35, "ml"),   # absorbed oil while deep frying ("f200", 1.5, "tsp"),
    ], "Knead a firm atta dough; roll small circles and deep fry until puffed.\nMake potato masala with onion, turmeric and mashed potato.\nServe hot pooris with masala."),
    ("Punugulu", 3, [
        ("f063", 150, "g"), ("f147", 50, "g"), ("f041", 2, "piece"),
        ("f040", 1, "tbsp"), ("f200", 1, "tsp"), ("f180", 35, "ml"),   # absorbed oil while deep frying
    ], "Grind rice and urad to a thick batter; ferment 4 hours.\nMix in green chili, ginger and salt.\nDrop small balls into hot oil; fry until crisp."),
    ("Mirchi Bajji", 3, [
        ("f041", 8, "piece"), ("f082", 100, "g"), ("f083", 20, "g"),
        ("f203", 1, "tsp"), ("f180", 40, "ml"),   # absorbed oil while deep frying ("f200", 1, "tsp"),
    ], "Slit chilies and remove seeds; rub with spices.\nDip in besan-rice flour batter.\nDeep fry until golden; serve with chutney."),
    ("Vegetable Pakora", 4, [
        ("f082", 120, "g"), ("f020", 1, "piece"), ("f022", 1, "piece"),
        ("f027", 30, "g"), ("f203", 1, "tsp"), ("f180", 40, "ml"),   # absorbed oil while deep frying ("f200", 1.5, "tsp"),
    ], "Mix besan with sliced onion, potato, spinach and spices.\nAdd water to make a thick batter.\nFry spoonfuls until crisp and golden."),
    ("Rava Kesari", 4, [
        ("f084", 100, "g"), ("f184", 100, "g"), ("f106", 3, "tbsp"),
        ("f157", 20, "g"), ("f220", 300, "ml"), ("f006", 0.5, "piece"),
    ], "Roast rava in ghee.\nBoil water; add rava slowly and cook.\nStir in sugar, saffron mango and cashews until glossy."),
    ("Mysore Masala Dosa", 3, [
        ("f063", 250, "g"), ("f147", 60, "g"), ("f022", 3, "piece"),
        ("f082", 2, "tbsp"), ("f203", 1, "tsp"), ("f180", 3, "tbsp"), ("f200", 1, "tsp"),
    ], "Ferment dosa batter overnight.\nSpread dosa; brush red chutney of besan-chili.\nAdd potato masala, fold and crisp."),

    # ---------------- SOUTH INDIAN RICE DISHES ----------------
    ("Curd Rice (Daddojanam)", 2, [
        ("f063", 200, "g"), ("f102", 250, "g"), ("f101", 100, "ml"),
        ("f205", 0.5, "tsp"), ("f041", 1, "piece"), ("f042", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook rice soft; mash with milk and curd.\nTemper cumin and green chili; fold in.\nGarnish with coriander and rest 20 minutes."),
    ("Lemon Rice", 2, [
        ("f063", 200, "g"), ("f159", 30, "g"), ("f202", 0.5, "tsp"),
        ("f041", 2, "piece"), ("f015", 1, "piece"), ("f106", 1, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook rice and spread to cool.\nTemper mustard, peanuts, turmeric and chili.\nSqueeze lemon, toss everything."),
    ("Tamarind Rice (Pulihora)", 3, [
        ("f063", 250, "g"), ("f209", 30, "g"), ("f159", 30, "g"),
        ("f203", 1, "tsp"), ("f202", 0.5, "tsp"), ("f106", 2, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Cook rice; spread to cool.\nSimmer tamarind extract with chili powder, turmeric and salt until thick.\nTemper peanuts and sesame; mix into rice."),
    ("Coconut Rice", 2, [
        ("f063", 200, "g"), ("f165", 40, "g"), ("f157", 20, "g"),
        ("f205", 0.5, "tsp"), ("f041", 1, "piece"), ("f106", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook rice and cool.\nFry cashews, cumin and chili in ghee.\nFold in grated coconut and rice."),
    ("Tomato Bath", 2, [
        ("f063", 200, "g"), ("f021", 3, "piece"), ("f020", 1, "piece"),
        ("f204", 1, "tsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Saute onion and tomatoes until mushy.\nAdd rice, coriander powder and salt with 2.5 cups water.\nPressure cook 3 whistles."),
    ("Bisi Bele Bath", 4, [
        ("f063", 200, "g"), ("f140", 100, "g"), ("f024", 1, "piece"),
        ("f031", 50, "g"), ("f032", 50, "g"), ("f209", 20, "g"), ("f106", 3, "tbsp"), ("f200", 2, "tsp"),
    ], "Cook rice and toor dal with vegetables.\nSimmer tamarind water with spices.\nMix everything; finish with ghee and cashews."),
    ("Sambar Rice", 3, [
        ("f063", 150, "g"), ("f140", 100, "g"), ("f021", 2, "piece"),
        ("f020", 1, "piece"), ("f209", 15, "g"), ("f202", 0.5, "tsp"), ("f200", 1.5, "tsp"),
    ], "Pressure cook rice and dal together.\nBoil tamarind with tomato, onion and spices.\nCombine and simmer to a soft one-pot meal."),
    ("Ghee Rice", 3, [
        ("f063", 200, "g"), ("f106", 2, "tbsp"), ("f020", 1, "piece"),
        ("f157", 20, "g"), ("f200", 1, "tsp"),
    ], "Fry onion and cashews in ghee.\nAdd rice and salt with 2 cups water.\nCook until fluffy."),
    ("Jeera Rice", 3, [
        ("f063", 200, "g"), ("f205", 1.5, "tsp"), ("f106", 1.5, "tbsp"), ("f200", 1, "tsp"),
    ], "Temper cumin in ghee.\nAdd rice and salt with 2 cups water.\nCook covered until done."),
    ("Veg Pulao", 3, [
        ("f063", 200, "g"), ("f024", 1, "piece"), ("f031", 60, "g"),
        ("f032", 50, "g"), ("f029", 0.5, "piece"), ("f206", 0.5, "tsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Saute vegetables in oil with garam masala.\nAdd rice and 2.5 cups water.\nPressure cook 2 whistles."),
    ("Egg Fried Rice", 2, [
        ("f063", 200, "g"), ("f111", 3, "piece"), ("f029", 0.5, "piece"),
        ("f028", 75, "g"), ("f211", 1, "tbsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook rice; cool completely.\nScramble eggs; stir-fry capsicum and cabbage.\nToss rice with soy sauce, eggs and salt."),
    ("Chicken Fried Rice", 3, [
        ("f063", 200, "g"), ("f121", 200, "g"), ("f029", 0.5, "piece"),
        ("f028", 75, "g"), ("f211", 1.5, "tbsp"), ("f201", 0.5, "tsp"), ("f180", 2, "tbsp"),
    ], "Cook rice; cool.\nStir-fry chicken strips until cooked.\nAdd vegetables, rice, soy and pepper; toss on high heat."),
    ("Veg Fried Rice", 3, [
        ("f063", 200, "g"), ("f028", 100, "g"), ("f024", 1, "piece"),
        ("f031", 60, "g"), ("f211", 1.5, "tbsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook rice; cool.\nStir-fry cabbage, carrot and beans on high heat.\nAdd rice, soy sauce and salt; toss."),
    ("Chakkara Pongal (Sweet Pongal)", 4, [
        ("f063", 150, "g"), ("f142", 30, "g"), ("f186", 150, "g"),
        ("f106", 3, "tbsp"), ("f157", 25, "g"), ("f165", 20, "g"),
    ], "Cook rice and moong until soft.\nMelt jaggery; add to the rice.\nFinish with ghee, cashews and coconut."),

    # ---------------- BIRYANIS ----------------
    ("Hyderabadi Chicken Dum Biryani", 5, [
        ("f063", 300, "g"), ("f121", 600, "g"), ("f102", 200, "g"),
        ("f020", 2, "piece"), ("f043", 20, "g"), ("f203", 2, "tsp"),
        ("f206", 2, "tsp"), ("f106", 3, "tbsp"), ("f200", 2, "tsp"),
    ], "Marinate chicken in curd, chili powder and garam masala for 2 hours.\nFry onions; layer marinated chicken, then half-cooked rice.\nSeal and dum-cook on low 40 minutes."),
    ("Chicken Biryani (Pressure Cooker)", 4, [
        ("f063", 250, "g"), ("f121", 500, "g"), ("f102", 150, "g"),
        ("f020", 2, "piece"), ("f040", 1, "tbsp"), ("f203", 1.5, "tsp"),
        ("f206", 1.5, "tsp"), ("f180", 3, "tbsp"), ("f200", 2, "tsp"),
    ], "Marinate chicken in curd and spices.\nSaute onions; add chicken and cook 10 minutes.\nAdd rice and water; pressure cook 2 whistles."),
    ("Mutton Biryani", 5, [
        ("f063", 300, "g"), ("f124", 600, "g"), ("f102", 200, "g"),
        ("f020", 3, "piece"), ("f203", 2, "tsp"), ("f206", 2, "tsp"),
        ("f106", 3, "tbsp"), ("f200", 2.5, "tsp"),
    ], "Marinate mutton in curd and spices overnight.\nCook mutton until tender.\nLayer with rice; dum-cook 30 minutes."),
    ("Veg Biryani", 4, [
        ("f063", 250, "g"), ("f024", 1, "piece"), ("f031", 60, "g"),
        ("f032", 60, "g"), ("f026", 150, "g"), ("f102", 100, "g"),
        ("f206", 1.5, "tsp"), ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Fry onions; saute vegetables with spices.\nLayer with rice and curd.\nDum-cook 25 minutes on low."),
    ("Paneer Biryani", 4, [
        ("f063", 250, "g"), ("f104", 200, "g"), ("f102", 100, "g"),
        ("f020", 2, "piece"), ("f043", 15, "g"), ("f206", 1.5, "tsp"),
        ("f106", 2, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Lightly fry paneer cubes.\nLayer rice with spiced curd, paneer, mint and fried onion.\nDum-cook 20 minutes."),
    ("Egg Biryani", 4, [
        ("f063", 250, "g"), ("f111", 4, "piece"), ("f020", 2, "piece"),
        ("f203", 1.5, "tsp"), ("f206", 1.5, "tsp"), ("f102", 50, "g"),
        ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Boil eggs; halve and lightly fry with spices.\nMake masala with onions and tomatoes.\nLayer rice, eggs and masala; dum 15 minutes."),

    # ---------------- SAMBAR / RASAM / PAPPU ----------------
    ("Classic Vegetable Sambar", 4, [
        ("f140", 150, "g"), ("f021", 2, "piece"), ("f020", 1, "piece"),
        ("f209", 20, "g"), ("f202", 0.5, "tsp"), ("f204", 1, "tsp"),
        ("f180", 2, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Cook toor dal until soft.\nBoil vegetables with tamarind, tomato and spices.\nAdd dal; simmer 10 minutes with tempering."),
    ("Pepper Rasam", 4, [
        ("f209", 25, "g"), ("f021", 2, "piece"), ("f201", 1, "tsp"),
        ("f039", 4, "clove"), ("f205", 0.5, "tsp"), ("f200", 1, "tsp"),
    ], "Coarsely crush pepper and cumin with garlic.\nBoil tamarind extract with tomato and spice mix.\nSimmer 5 minutes; do not over-boil."),
    ("Tomato Rasam", 4, [
        ("f209", 20, "g"), ("f021", 3, "piece"), ("f039", 3, "clove"),
        ("f204", 1, "tsp"), ("f042", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Mash tomatoes into tamarind water.\nBoil with garlic, coriander powder and salt.\nTemper mustard and curry leaves in ghee."),
    ("Andhra Spinach Pappu", 3, [
        ("f140", 150, "g"), ("f027", 100, "g"), ("f021", 1, "piece"),
        ("f039", 3, "clove"), ("f203", 1, "tsp"), ("f200", 1.5, "tsp"),
    ], "Pressure cook toor dal with spinach and tomato.\nTemper garlic and red chili.\nMash lightly; simmer 5 minutes."),
    ("Brinjal Sambar", 3, [
        ("f036", 300, "g"), ("f140", 100, "g"), ("f209", 15, "g"),
        ("f021", 1, "piece"), ("f202", 0.5, "tsp"), ("f200", 1.5, "tsp"),
    ], "Cube brinjal; saute until half done.\nCook dal with tamarind and tomato.\nAdd brinjal; simmer until soft."),

    # ---------------- PORIYAL / KURA / FRY ----------------
    ("Beetroot Poriyal", 3, [
        ("f034", 300, "g"), ("f165", 20, "g"), ("f041", 1, "piece"),
        ("f180", 1, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Grate beetroot.\nTemper mustard and chili; add beetroot and salt.\nCook covered; finish with coconut."),
    ("Beans Poriyal", 3, [
        ("f031", 200, "g"), ("f165", 20, "g"), ("f041", 1, "piece"),
        ("f180", 1, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Chop beans fine.\nTemper mustard and green chili.\nCook beans; toss with coconut."),
    ("Carrot Beans Poriyal", 3, [
        ("f024", 1, "piece"), ("f031", 100, "g"), ("f165", 20, "g"),
        ("f180", 1, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Dice carrot and beans.\nTemper mustard seeds.\nCook vegetables; mix coconut."),
    ("Cabbage Poriyal", 3, [
        ("f028", 200, "g"), ("f165", 20, "g"), ("f041", 1, "piece"),
        ("f180", 1, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Shred cabbage.\nTemper chili; add cabbage with salt.\nCook until just tender; add coconut."),
    ("Spinach Moong Kootu", 3, [
        ("f027", 150, "g"), ("f142", 80, "g"), ("f165", 25, "g"),
        ("f201", 0.5, "tsp"), ("f200", 1, "tsp"),
    ], "Cook moong dal until soft.\nAdd chopped spinach and cook 5 minutes.\nMix ground coconut-pepper paste; simmer."),
    ("Gutti Vankaya Kura", 3, [
        ("f036", 500, "g"), ("f159", 40, "g"), ("f163", 20, "g"),
        ("f209", 20, "g"), ("f203", 1, "tsp"), ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Roast peanuts and sesame; grind with tamarind and spices.\nStuff the paste into slit brinjals.\nCook covered on low until soft."),
    ("Bendakaya Fry (Okra Fry)", 2, [
        ("f035", 300, "g"), ("f203", 1, "tsp"), ("f180", 2, "tbsp"),
        ("f200", 1, "tsp"),
    ], "Chop okra and dry on a towel.\nFry on medium until the slime disappears.\nAdd chili powder and salt; crisp up."),
    ("Aloo Fry (South Style)", 2, [
        ("f022", 4, "piece"), ("f203", 1, "tsp"), ("f042", 2, "tbsp"),
        ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Boil and cube potatoes.\nFry with chili powder until edges crisp.\nGarnish with coriander."),
    ("Egg Curry (South Style)", 3, [
        ("f111", 4, "piece"), ("f020", 2, "piece"), ("f021", 2, "piece"),
        ("f165", 30, "g"), ("f203", 1, "tsp"), ("f180", 2, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Boil eggs; halve.\nMake coconut-onion-tomato masala.\nAdd eggs; simmer 8 minutes."),
    ("Chicken Chettinad", 4, [
        ("f121", 600, "g"), ("f020", 2, "piece"), ("f021", 1, "piece"),
        ("f165", 40, "g"), ("f201", 1, "tsp"), ("f205", 1, "tsp"),
        ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Roast and grind pepper, cumin and coconut.\nSaute onion and tomato; add chicken.\nAdd the masala; cook until done."),
    ("Pepper Chicken", 3, [
        ("f121", 500, "g"), ("f201", 2, "tsp"), ("f020", 1, "piece"),
        ("f042", 3, "tbsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Crush pepper coarsely.\nFry chicken with onion until sealed.\nAdd pepper and salt; roast until dry."),
    ("Kerala Chicken Curry", 4, [
        ("f121", 600, "g"), ("f165", 60, "g"), ("f020", 2, "piece"),
        ("f021", 1, "piece"), ("f202", 0.5, "tsp"), ("f203", 1.5, "tsp"),
        ("f183", 2, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Grind coconut with spices into a paste.\nBrown onions; add chicken and paste.\nSimmer until chicken is tender."),
    ("Chicken 65", 3, [
        ("f121", 400, "g"), ("f102", 100, "g"), ("f203", 2, "tsp"),
        ("f090", 2, "tbsp"), ("f112", 1, "piece"), ("f180", 40, "ml"),   # absorbed oil while deep frying
    ], "Marinate chicken in curd, chili and cornflour.\nDeep fry until crisp.\nToss with curry leaves and yogurt drizzle."),
    ("Chepala Pulusu (Fish Curry)", 4, [
        ("f127", 500, "g"), ("f209", 30, "g"), ("f020", 1, "piece"),
        ("f021", 1, "piece"), ("f203", 1.5, "tsp"), ("f202", 0.5, "tsp"),
        ("f039", 4, "clove"), ("f200", 1.5, "tsp"),
    ], "Clean and salt the fish.\nBoil tamarind with onion, tomato and spices.\nAdd fish; simmer gently 10 minutes."),
    ("Andhra Fish Fry", 3, [
        ("f127", 400, "g"), ("f203", 1.5, "tsp"), ("f202", 0.5, "tsp"),
        ("f015", 1, "piece"), ("f040", 1, "tbsp"), ("f180", 3, "tbsp"),
    ], "Marinate fish in chili, turmeric, ginger and lemon.\nRest 30 minutes.\nShallow fry until crisp both sides."),
    ("Prawn Fry", 2, [
        ("f131", 300, "g"), ("f020", 1, "piece"), ("f203", 1, "tsp"),
        ("f201", 0.5, "tsp"), ("f183", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Clean prawns.\nSaute onion; add prawns and spices.\nRoast until dry and crisp."),
    ("Mutton Kura", 4, [
        ("f124", 600, "g"), ("f020", 2, "piece"), ("f102", 100, "g"),
        ("f203", 2, "tsp"), ("f206", 1, "tsp"), ("f180", 3, "tbsp"), ("f200", 2, "tsp"),
    ], "Pressure cook mutton with salt and chili.\nFry onions; add cooked mutton.\nRoast until masala coats."),

    # ---------------- CHUTNEYS & PICKLES ----------------
    ("Coconut Chutney", 4, [
        ("f165", 80, "g"), ("f159", 30, "g"), ("f041", 2, "piece"),
        ("f209", 5, "g"), ("f200", 1, "tsp"),
    ], "Grind coconut, peanuts, chili and tamarind with water.\nTemper mustard in oil; pour over."),
    ("Tomato Onion Chutney", 4, [
        ("f021", 3, "piece"), ("f020", 1, "piece"), ("f039", 3, "clove"),
        ("f203", 1, "tsp"), ("f180", 1, "tbsp"), ("f200", 1, "tsp"),
    ], "Saute onion, tomato and garlic.\nCool and blend with chili and salt.\nTemper mustard seeds."),
    ("Peanut Chutney", 4, [
        ("f159", 60, "g"), ("f039", 3, "clove"), ("f203", 1, "tsp"),
        ("f209", 10, "g"), ("f200", 1, "tsp"),
    ], "Roast peanuts with garlic and chili.\nBlend with tamarind and salt.\nTemper in hot oil."),
    ("Avakaya (Mango Pickle)", 10, [
        ("f006", 500, "g"), ("f203", 50, "g"), ("f214", 6, "tsp"),
        ("f163", 30, "g"), ("f182", 50, "ml"),   # oil retained in pickle ("f200", 3, "tsp"),
    ], "Cut raw mango into cubes; dry completely.\nMix chili powder, mustard paste, sesame and salt.\nBottle with mustard oil; rest 3 days."),

    ("Mysore Bonda", 3, [
        ("f147", 150, "g"), ("f165", 25, "g"), ("f041", 2, "piece"),
        ("f040", 1, "tbsp"), ("f200", 1, "tsp"), ("f180", 40, "ml"),   # absorbed oil while deep frying
     ], "Soak urad dal; grind into a fluffy batter.\nFold in coconut, chili, ginger and salt.\nFry spoonfuls until golden."),

    # ---------------- SOUTH SWEETS ----------------
    ("Semiya Payasam", 4, [
        ("f089", 100, "g"), ("f100", 500, "ml"), ("f184", 80, "g"),
        ("f106", 2, "tbsp"), ("f157", 25, "g"),
    ], "Fry vermicelli in ghee.\nBoil milk; add vermicelli and cook.\nSweeten; garnish with cashews."),
    ("Rava Laddu", 6, [
        ("f084", 150, "g"), ("f184", 120, "g"), ("f106", 4, "tbsp"),
        ("f165", 30, "g"),
    ], "Roast rava and grind coarse.\nMix with coconut, sugar and hot ghee.\nShape into laddus."),
    ("Mysore Pak", 8, [
        ("f082", 150, "g"), ("f184", 200, "g"), ("f106", 250, "g"),
    ], "Caramelize sugar to one-string consistency.\nRoast besan in ghee.\nPour syrup; beat until porous; set and cut."),
    ("Bobbatlu (Puran Poli)", 4, [
        ("f081", 150, "g"), ("f146", 150, "g"), ("f186", 150, "g"),
        ("f106", 3, "tbsp"),
    ], "Cook chana dal with jaggery; mash into puran.\nStuff into maida dough rounds.\nRoll thin; roast with ghee."),
    ("Double ka Meetha", 4, [
        ("f066", 4, "slice"), ("f100", 200, "ml"), ("f184", 100, "g"),
        ("f106", 3, "tbsp"), ("f155", 20, "g"),
    ], "Fry bread slices in ghee.\nDip in saffron milk; coat with sugar syrup.\nGarnish with almonds."),
    ("Badam Halwa", 4, [
        ("f155", 200, "g"), ("f184", 150, "g"), ("f106", 100, "g"),
        ("f100", 200, "ml"),
    ], "Soak and peel almonds; grind to paste.\nCook paste with sugar in ghee.\nStir until it leaves the pan."),

    # ---------------- NORTH INDIAN ----------------
    ("Palak Paneer", 3, [
        ("f027", 300, "g"), ("f104", 200, "g"), ("f020", 1, "piece"),
        ("f021", 1, "piece"), ("f109", 2, "tbsp"), ("f206", 0.5, "tsp"),
        ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Blanch spinach; puree.\nSaute onion-tomato; add spinach.\nFold in paneer cubes with cream."),
    ("Matar Paneer", 3, [
        ("f032", 150, "g"), ("f104", 200, "g"), ("f021", 2, "piece"),
        ("f020", 1, "piece"), ("f206", 0.5, "tsp"), ("f109", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Make tomato-onion masala.\nAdd peas and cook.\nAdd paneer and cream; simmer 5 minutes."),
    ("Kadai Paneer", 3, [
        ("f029", 2, "piece"), ("f104", 200, "g"), ("f021", 2, "piece"),
        ("f020", 1, "piece"), ("f204", 1.5, "tsp"), ("f109", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Dice capsicum and paneer.\nCook crushed tomato with coriander powder.\nAdd capsicum and paneer; finish with cream."),
    ("Paneer Tikka", 3, [
        ("f104", 250, "g"), ("f102", 100, "g"), ("f203", 1, "tsp"),
        ("f201", 0.5, "tsp"), ("f029", 1, "piece"), ("f181", 1, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Marinate paneer and capsicum in spiced curd.\nSkewer and grill until charred."),
    ("Shahi Paneer", 3, [
        ("f104", 200, "g"), ("f157", 40, "g"), ("f020", 1, "piece"),
        ("f021", 1, "piece"), ("f109", 3, "tbsp"), ("f206", 0.5, "tsp"), ("f200", 1, "tsp"),
    ], "Grind cashews with onion and tomato.\nCook into a silky gravy.\nAdd paneer; simmer briefly."),
    ("Dal Tadka", 4, [
        ("f140", 100, "g"), ("f144", 100, "g"), ("f106", 2, "tbsp"),
        ("f205", 1, "tsp"), ("f020", 1, "piece"), ("f021", 1, "piece"), ("f200", 1.5, "tsp"),
    ], "Pressure cook both dals.\nPrepare tomato-onion masala; add dal.\nFinish with a ghee-cumin tadka."),
    ("Dal Makhani", 4, [
        ("f147", 200, "g"), ("f148", 50, "g"), ("f105", 2, "tbsp"),
        ("f109", 3, "tbsp"), ("f021", 2, "piece"), ("f200", 1.5, "tsp"),
    ], "Soak and cook urad with rajma until soft.\nSimmer with tomato, butter and cream for 30 minutes.\nMash lightly before serving."),
    ("Dal Fry", 4, [
        ("f144", 200, "g"), ("f020", 1, "piece"), ("f021", 1, "piece"),
        ("f106", 2, "tbsp"), ("f205", 1, "tsp"), ("f202", 0.5, "tsp"), ("f200", 1.5, "tsp"),
    ], "Cook masoor dal.\nSaute onion-tomato with cumin and turmeric.\nPour over dal; simmer."),
    ("Chole (Chana Masala)", 4, [
        ("f150", 200, "g"), ("f020", 2, "piece"), ("f021", 2, "piece"),
        ("f206", 1, "tsp"), ("f203", 1, "tsp"), ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Soak and pressure cook chana.\nCook onion-tomato masala with spices.\nAdd chana; simmer 15 minutes."),
    ("Aloo Gobhi", 3, [
        ("f022", 3, "piece"), ("f026", 300, "g"), ("f202", 0.5, "tsp"),
        ("f204", 1, "tsp"), ("f206", 0.5, "tsp"), ("f180", 3, "tbsp"), ("f200", 1, "tsp"),
    ], "Cube potato and cauliflower.\nTemper cumin; add vegetables and spices.\nCover and cook until tender."),
    ("Aloo Matar", 3, [
        ("f022", 3, "piece"), ("f032", 150, "g"), ("f021", 1, "piece"),
        ("f205", 1, "tsp"), ("f206", 0.5, "tsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Cook potato cubes with cumin.\nAdd peas, tomato and spices.\nSimmer until thick."),
    ("Bhindi Masala", 3, [
        ("f035", 300, "g"), ("f020", 1, "piece"), ("f021", 1, "piece"),
        ("f204", 1, "tsp"), ("f206", 0.5, "tsp"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Fry okra until dry.\nMake onion-tomato masala.\nToss okra in the masala."),
    ("Baingan Bharta", 3, [
        ("f036", 500, "g"), ("f020", 1, "piece"), ("f021", 2, "piece"),
        ("f039", 4, "clove"), ("f041", 1, "piece"), ("f180", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Roast eggplant over flame; peel and mash.\nSaute onion, garlic, tomato.\nMix in the mash; cook 5 minutes."),
    ("Matar Mushroom", 3, [
        ("f033", 250, "g"), ("f032", 100, "g"), ("f020", 1, "piece"),
        ("f021", 1, "piece"), ("f109", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Saute mushrooms until browned.\nAdd onion-tomato masala and peas.\nFinish with cream."),
    ("Kadhi Pakora", 4, [
        ("f102", 300, "g"), ("f082", 140, "g"), ("f020", 1, "piece"),
        ("f202", 0.5, "tsp"), ("f180", 3, "tbsp"), ("f200", 1.5, "tsp"),
    ], "Whisk curd with 80 g besan, turmeric and water; simmer.\nMake pakoras with the rest of the besan.\nDrop pakoras into kadhi; rest before serving."),
    ("Butter Chicken", 4, [
        ("f121", 600, "g"), ("f021", 4, "piece"), ("f105", 3, "tbsp"),
        ("f109", 4, "tbsp"), ("f157", 30, "g"), ("f206", 1, "tsp"), ("f187", 1, "tsp"),
    ], "Marinate and grill chicken.\nBlend tomato-cashew gravy.\nAdd chicken, butter, cream and honey; simmer."),
    ("Chicken Tikka Masala", 4, [
        ("f121", 500, "g"), ("f102", 150, "g"), ("f021", 3, "piece"),
        ("f109", 3, "tbsp"), ("f206", 1, "tsp"), ("f203", 1, "tsp"),
    ], "Marinate chicken in curd and spices; grill.\nSimmer tomato gravy.\nAdd tikka pieces and cream."),
    ("Mutton Rogan Josh", 4, [
        ("f124", 600, "g"), ("f102", 200, "g"), ("f020", 2, "piece"),
        ("f206", 1.5, "tsp"), ("f203", 1, "tsp"), ("f106", 2, "tbsp"), ("f200", 2, "tsp"),
    ], "Brown onions in ghee.\nAdd mutton with whisked curd and spices.\nCook covered until tender."),
    ("Pav Bhaji", 3, [
        ("f066", 6, "slice"), ("f022", 3, "piece"), ("f021", 2, "piece"),
        ("f032", 100, "g"), ("f029", 1, "piece"), ("f105", 2, "tbsp"), ("f200", 2, "tsp"),
    ], "Boil and mash potato and peas.\nCook masala with tomato, capsicum and butter.\nServe with buttered pav."),
    ("Aloo Paratha", 3, [
        ("f080", 200, "g"), ("f022", 3, "piece"), ("f041", 1, "piece"),
        ("f203", 0.5, "tsp"), ("f106", 2, "tbsp"), ("f200", 1, "tsp"),
    ], "Mash boiled potato with chili and salt.\nStuff into atta dough balls.\nRoll and roast with ghee."),
    ("Paneer Paratha", 3, [
        ("f080", 200, "g"), ("f104", 150, "g"), ("f041", 1, "piece"),
        ("f106", 2, "tbsp"), ("f200", 0.75, "tsp"),
    ], "Crumble paneer with chili and salt.\nStuff into atta rounds.\nRoast with ghee until golden."),
    ("Vegetable Samosa", 6, [
        ("f081", 200, "g"), ("f022", 3, "piece"), ("f032", 100, "g"),
        ("f205", 1, "tsp"), ("f180", 40, "ml"),   # absorbed oil while deep frying ("f200", 1.5, "tsp"),
    ], "Make a stiff maida dough; rest 30 minutes.\nCook spiced potato-pea filling.\nShape cones, fill and deep fry."),
    ("Masala Maggi", 2, [
        ("f249", 2, "pack"), ("f020", 0.5, "piece"), ("f021", 1, "piece"),
        ("f029", 0.5, "piece"), ("f203", 0.5, "tsp"),
    ], "Saute onion, tomato and capsicum.\nAdd 2 cups water, masala and noodles.\nCook until the sauce coats."),
    ("Masala Chai", 2, [
        ("f101", 250, "ml"), ("f184", 2, "tsp"), ("f040", 0.5, "tbsp"),
        ("f206", 1, "pinch"),
    ], "Simmer milk with grated ginger and a pinch of garam masala.\nAdd strong brewed tea.\nSweeten, strain and serve hot."),
]
