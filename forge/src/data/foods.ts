import type { Food, Portion } from '../lib/types.ts'
import { normalize } from './exercises.ts'

/**
 * Base d'aliments courants (valeurs moyennes pour 100 g ou 100 ml, ordre de grandeur Ciqual).
 * Glucides hors fibres (convention des étiquettes européennes).
 * Les produits de marque viennent d'Open Food Facts (recherche en ligne + scan du code-barres).
 */
type P = [label: string, grams: number]
type Row = [name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number, portions?: P[], unit?: 'g' | 'ml']

const CATEGORIES: Record<string, Row[]> = {
  Viandes: [
    ['Blanc de poulet cru', 112, 23.5, 0, 1.8, 0, [['1 filet', 150]]],
    ['Blanc de poulet cuit', 160, 31, 0, 3.6, 0, [['1 filet', 120]]],
    ['Cuisse de poulet sans peau crue', 121, 19.7, 0, 4.1, 0],
    ['Escalope de dinde crue', 108, 24, 0, 1.3, 0, [['1 escalope', 120]]],
    ['Escalope de veau crue', 110, 22, 0, 2.3, 0, [['1 escalope', 120]]],
    ['Steak haché 5 % MG cru', 128, 21, 0, 5, 0, [['1 steak', 100], ['1 gros steak', 125]]],
    ['Steak haché 15 % MG cru', 210, 18.5, 0, 15, 0, [['1 steak', 100], ['1 gros steak', 125]]],
    ['Steak haché 20 % MG cru', 250, 17.5, 0, 20, 0, [['1 steak', 100]]],
    ['Bœuf rumsteck cru', 125, 22, 0, 4, 0, [['1 pavé', 180]]],
    ['Bœuf bavette crue', 140, 21, 0, 6.2, 0, [['1 pièce', 150]]],
    ['Filet mignon de porc cru', 115, 22, 0, 3, 0],
    ['Jambon blanc découenné dégraissé', 107, 21, 0.8, 2.2, 0, [['1 tranche', 40]]],
    ['Blanc de dinde (tranches)', 98, 20, 1, 1.5, 0, [['1 tranche', 30]]],
    ['Lardons fumés crus', 262, 15, 0, 22.5, 0, [['1 barquette', 100]]],
    ['Saucisse de Toulouse crue', 270, 15, 1, 23, 0, [['1 saucisse', 100]]],
    ['Gigot d’agneau cru', 160, 20, 0, 9, 0],
  ],
  Poissons: [
    ['Saumon cru', 200, 20, 0, 13.4, 0, [['1 pavé', 125]]],
    ['Saumon fumé', 180, 22, 0.5, 10, 0, [['1 tranche', 25]]],
    ['Thon au naturel égoutté', 115, 26, 0, 1.1, 0, [['1 petite boîte égouttée', 104]]],
    ['Thon à l’huile égoutté', 200, 25, 0, 11, 0, [['1 petite boîte égouttée', 104]]],
    ['Cabillaud cru', 75, 17.6, 0, 0.6, 0, [['1 dos', 140]]],
    ['Colin (lieu) cru', 80, 18, 0, 0.8, 0, [['1 filet', 130]]],
    ['Crevettes cuites décortiquées', 95, 21.5, 0, 1, 0],
    ['Sardines à l’huile égouttées', 210, 24, 0, 12.5, 0, [['1 boîte égouttée', 85]]],
    ['Maquereau cru', 193, 19, 0, 13, 0],
    ['Truite crue', 138, 20, 0, 6.5, 0],
    ['Surimi', 106, 8, 13, 2.5, 0, [['1 bâtonnet', 17]]],
  ],
  'Œufs & laitiers': [
    ['Œuf entier', 140, 12.7, 0.3, 9.8, 0, [['1 œuf moyen', 50], ['1 gros œuf', 60]]],
    ['Blanc d’œuf', 48, 10.7, 0.7, 0.2, 0, [['1 blanc', 33]]],
    ['Jaune d’œuf', 327, 16, 0.5, 29, 0, [['1 jaune', 17]]],
    ['Lait demi-écrémé', 46, 3.3, 4.8, 1.6, 0, [['1 verre', 200], ['1 bol', 250]], 'ml'],
    ['Lait écrémé', 34, 3.4, 4.9, 0.1, 0, [['1 verre', 200], ['1 bol', 250]], 'ml'],
    ['Lait entier', 64, 3.3, 4.7, 3.6, 0, [['1 verre', 200], ['1 bol', 250]], 'ml'],
    ['Skyr nature', 62, 11, 4, 0.2, 0, [['1 pot', 150]]],
    ['Fromage blanc 0 %', 47, 7.6, 4, 0.1, 0, [['1 portion', 150]]],
    ['Fromage blanc 3 %', 73, 7, 4, 3.2, 0, [['1 portion', 150]]],
    ['Yaourt nature', 53, 4.3, 5.3, 1.5, 0, [['1 pot', 125]]],
    ['Yaourt à la grecque', 126, 5, 4, 10, 0, [['1 pot', 150]]],
    ['Yaourt grec 0 %', 54, 10.3, 3, 0, 0, [['1 pot', 170]]],
    ['Cottage cheese', 97, 11, 3.4, 4.3, 0, [['1 pot', 200]]],
    ['Crème fraîche épaisse 30 %', 292, 2.4, 3, 30, 0, [['1 c. à soupe', 15]]],
    ['Crème légère 15 %', 162, 2.8, 4, 15, 0, [['1 c. à soupe', 15]]],
    ['Beurre doux', 743, 0.7, 0.6, 82, 0, [['1 noisette', 10]]],
    ['Boisson amande non sucrée', 13, 0.5, 0.1, 1.1, 0.3, [['1 verre', 200]], 'ml'],
    ['Boisson avoine', 44, 0.7, 6.5, 1.5, 0.8, [['1 verre', 200]], 'ml'],
    ['Boisson soja nature', 33, 3.3, 0.2, 1.9, 0.6, [['1 verre', 200]], 'ml'],
  ],
  Fromages: [
    ['Emmental', 380, 28.5, 0, 29.5, 0, [['1 portion', 30], ['1 poignée râpé', 20]]],
    ['Comté', 410, 27.5, 0, 33.5, 0, [['1 portion', 30]]],
    ['Mozzarella', 250, 18.6, 1, 19.1, 0, [['1 boule', 125]]],
    ['Parmesan', 392, 34, 0, 28.5, 0, [['1 c. à soupe râpé', 6]]],
    ['Feta', 262, 15, 1, 22, 0, [['1 portion', 30]]],
    ['Camembert', 271, 20, 0.5, 21, 0, [['1 portion', 30]]],
    ['Chèvre frais', 200, 11, 3, 16, 0, [['1 portion', 30]]],
  ],
  Féculents: [
    ['Riz blanc cru', 352, 7, 79, 0.6, 1.3, [['1 portion', 70]]],
    ['Riz blanc cuit', 128, 2.6, 28.5, 0.3, 0.4, [['1 assiette', 200]]],
    ['Riz basmati cru', 350, 8, 77, 0.8, 1.5, [['1 portion', 70]]],
    ['Riz basmati cuit', 126, 2.9, 27.5, 0.4, 0.4, [['1 assiette', 200]]],
    ['Riz complet cru', 353, 7.5, 73, 2.7, 3.5, [['1 portion', 70]]],
    ['Riz complet cuit', 118, 2.7, 24, 0.9, 1.6, [['1 assiette', 200]]],
    ['Pâtes crues', 355, 12.5, 70.5, 1.7, 3, [['1 portion', 80]]],
    ['Pâtes cuites', 150, 5.2, 29.5, 0.9, 1.5, [['1 assiette', 200]]],
    ['Pâtes complètes crues', 346, 13, 64, 2.5, 8, [['1 portion', 80]]],
    ['Pâtes complètes cuites', 146, 5.5, 27, 1.1, 3.4, [['1 assiette', 200]]],
    ['Semoule de blé crue', 359, 12.5, 72, 1.5, 3.5, [['1 portion', 70]]],
    ['Boulgour cru', 351, 12, 69, 1.5, 7, [['1 portion', 70]]],
    ['Quinoa cru', 364, 14, 60, 6, 7, [['1 portion', 70]]],
    ['Quinoa cuit', 118, 4.4, 19.5, 1.9, 2.8, [['1 assiette', 180]]],
    ['Pomme de terre crue', 79, 2, 16.5, 0.1, 2, [['1 moyenne', 150]]],
    ['Pomme de terre cuite à l’eau', 80, 1.9, 17, 0.1, 1.8, [['1 moyenne', 150]]],
    ['Patate douce crue', 83, 1.6, 17.5, 0.1, 3, [['1 moyenne', 200]]],
    ['Frites', 274, 3.5, 33, 13.5, 3.5, [['1 portion', 150]]],
    ['Crème de riz (poudre)', 357, 7, 80, 0.8, 1, [['1 portion', 50]]],
    ['Flocons d’avoine', 372, 13.5, 58.7, 7, 10, [['1 portion', 50]]],
    ['Muesli sans sucre ajouté', 355, 10, 60, 6.5, 8, [['1 bol', 50]]],
    ['Granola', 450, 9, 60, 18, 6, [['1 bol', 50]]],
    ['Corn flakes', 376, 7.5, 83, 0.9, 3, [['1 bol', 40]]],
    ['Galette de riz soufflé', 382, 8, 80, 2.8, 2.5, [['1 galette', 8]]],
  ],
  'Pains & viennoiseries': [
    ['Baguette', 273, 9, 55, 1.3, 2.7, [['1/4 de baguette', 60], ['1 baguette', 250]]],
    ['Pain complet', 245, 9, 43, 2.5, 7, [['1 tranche', 40]]],
    ['Pain aux céréales', 267, 10, 42, 5, 7, [['1 tranche', 40]]],
    ['Pain de mie', 279, 8.5, 50, 4.3, 3, [['1 tranche', 27]]],
    ['Pain de mie complet', 259, 9.5, 43, 4, 6.5, [['1 tranche', 27]]],
    ['Tortilla de blé', 298, 8.5, 49, 7, 2.5, [['1 tortilla', 60]]],
    ['Biscottes', 402, 12, 72, 6.5, 4, [['1 biscotte', 9]]],
    ['Croissant', 414, 8, 45, 22, 2, [['1 croissant', 50]]],
    ['Pain au chocolat', 426, 7.5, 46, 23, 2.5, [['1 pain au chocolat', 65]]],
  ],
  Légumineuses: [
    ['Lentilles vertes cuites', 111, 9, 14, 0.5, 7.5, [['1 assiette', 200]]],
    ['Lentilles crues', 328, 24, 49, 1.5, 11, [['1 portion', 70]]],
    ['Pois chiches cuits', 143, 8, 18.5, 2.5, 7.5, [['1 assiette', 200]]],
    ['Haricots rouges cuits', 109, 8.5, 14, 0.5, 7, [['1 assiette', 200]]],
    ['Haricots blancs cuits', 110, 7.5, 14.5, 0.5, 8, [['1 assiette', 200]]],
    ['Edamame', 117, 11, 4.5, 5, 5, [['1 bol', 100]]],
    ['Tofu nature', 121, 12.5, 1.5, 7, 1, [['1 pavé', 100]]],
    ['Houmous', 284, 7, 12, 22, 5, [['1 c. à soupe', 20]]],
  ],
  Légumes: [
    ['Brocoli cuit', 30, 2.7, 2.5, 0.4, 3, [['1 portion', 150]]],
    ['Haricots verts cuits', 30, 1.8, 3.5, 0.2, 3.5, [['1 portion', 150]]],
    ['Courgette', 18, 1.2, 2, 0.3, 1.1, [['1 courgette', 200]]],
    ['Tomate', 20, 0.9, 2.8, 0.3, 1.2, [['1 tomate', 120]]],
    ['Tomates cerises', 24, 1, 3.5, 0.3, 1.4, [['1 poignée', 80]]],
    ['Concombre', 13, 0.7, 2, 0.1, 0.6, [['1/2 concombre', 150]]],
    ['Carotte', 38, 0.8, 7, 0.2, 2.6, [['1 carotte', 80]]],
    ['Salade verte', 16, 1.3, 1.7, 0.2, 1.3, [['1 bol', 50]]],
    ['Épinards cuits', 24, 2.9, 1, 0.4, 2.4, [['1 portion', 150]]],
    ['Poivron', 28, 0.9, 4.7, 0.3, 1.7, [['1 poivron', 150]]],
    ['Champignons de Paris', 20, 3, 0.5, 0.3, 1.5, [['1 poignée', 80]]],
    ['Oignon', 40, 1.2, 7.5, 0.2, 1.7, [['1 oignon', 100]]],
    ['Chou-fleur cuit', 25, 2, 2.5, 0.3, 2.4, [['1 portion', 150]]],
    ['Petits pois cuits', 72, 5.4, 9, 0.4, 5.5, [['1 portion', 150]]],
    ['Maïs doux égoutté', 90, 2.8, 15, 1.5, 2.5, [['1 petite boîte', 140]]],
    ['Avocat', 161, 2, 1.9, 14.7, 6.7, [['1/2 avocat', 70]]],
    ['Asperges', 22, 2.2, 2, 0.1, 2, [['1 botte', 250]]],
    ['Aubergine', 22, 1, 3, 0.2, 2.5, [['1 aubergine', 250]]],
    ['Betterave cuite', 45, 1.7, 8, 0.2, 2, [['1 betterave', 100]]],
    ['Courge butternut', 41, 1, 8, 0.1, 2, [['1 portion', 200]]],
    ['Soupe de légumes', 35, 1, 5, 1, 1.2, [['1 bol', 300]]],
  ],
  Fruits: [
    ['Banane', 92, 1.1, 20, 0.3, 2.2, [['1 banane', 120]]],
    ['Pomme', 53, 0.3, 11.6, 0.2, 2, [['1 pomme', 150]]],
    ['Poire', 55, 0.4, 11.5, 0.2, 3, [['1 poire', 150]]],
    ['Orange', 46, 0.9, 9, 0.2, 2, [['1 orange', 150]]],
    ['Clémentine', 47, 0.8, 9.5, 0.2, 1.7, [['1 clémentine', 70]]],
    ['Kiwi', 55, 1.1, 10, 0.5, 3, [['1 kiwi', 75]]],
    ['Fraises', 33, 0.7, 6, 0.3, 2, [['1 barquette', 250]]],
    ['Framboises', 44, 1.2, 5, 0.7, 6.5, [['1 barquette', 125]]],
    ['Myrtilles', 57, 0.7, 12, 0.3, 2.4, [['1 barquette', 125]]],
    ['Fruits rouges surgelés', 45, 1, 7.5, 0.4, 4, [['1 portion', 100]]],
    ['Raisin', 70, 0.7, 16, 0.2, 0.9, [['1 grappe', 150]]],
    ['Ananas', 52, 0.5, 11.5, 0.1, 1.4, [['1 tranche', 100]]],
    ['Mangue', 66, 0.8, 14, 0.4, 1.6, [['1/2 mangue', 150]]],
    ['Pêche', 41, 0.9, 8.3, 0.2, 1.5, [['1 pêche', 150]]],
    ['Melon', 36, 0.8, 7.5, 0.2, 0.9, [['1/2 melon', 250]]],
    ['Pastèque', 32, 0.6, 7, 0.2, 0.4, [['1 tranche', 250]]],
    ['Dattes', 290, 2.2, 66, 0.4, 7, [['1 datte', 8]]],
    ['Abricots secs', 244, 3.4, 53, 0.5, 7, [['1 abricot', 8]]],
    ['Raisins secs', 300, 3, 69, 0.5, 4, [['1 poignée', 30]]],
    ['Compote sans sucre ajouté', 55, 0.3, 12.5, 0.1, 1.5, [['1 pot', 100]]],
  ],
  Oléagineux: [
    ['Amandes', 609, 21, 8, 52, 12.5, [['1 poignée', 30]]],
    ['Noix', 686, 15, 7, 65, 6.5, [['1 poignée', 30]]],
    ['Noix de cajou', 595, 18, 27, 46, 3.3, [['1 poignée', 30]]],
    ['Noisettes', 650, 15, 7, 61, 9.7, [['1 poignée', 30]]],
    ['Cacahuètes grillées', 610, 25, 13, 49, 8.5, [['1 poignée', 30]]],
    ['Beurre de cacahuète', 614, 25, 13, 50, 6, [['1 c. à soupe', 15]]],
    ['Purée d’amandes', 635, 24, 6, 55, 10, [['1 c. à soupe', 15]]],
    ['Graines de chia', 450, 17, 8, 31, 34, [['1 c. à soupe', 12]]],
    ['Graines de courge', 593, 30, 5, 49, 6, [['1 c. à soupe', 10]]],
  ],
  'Matières grasses': [
    ['Huile d’olive', 900, 0, 0, 100, 0, [['1 c. à soupe', 13], ['1 c. à café', 5]]],
    ['Huile de colza', 900, 0, 0, 100, 0, [['1 c. à soupe', 13], ['1 c. à café', 5]]],
    ['Huile de coco', 900, 0, 0, 100, 0, [['1 c. à soupe', 13]]],
  ],
  'Sucré': [
    ['Sucre', 400, 0, 100, 0, 0, [['1 morceau', 5], ['1 c. à café', 5]]],
    ['Miel', 322, 0.4, 80, 0, 0, [['1 c. à café', 8], ['1 c. à soupe', 20]]],
    ['Confiture', 247, 0.4, 61, 0.1, 0, [['1 c. à soupe', 20]]],
    ['Sirop d’érable', 268, 0, 67, 0, 0, [['1 c. à soupe', 20]]],
    ['Pâte à tartiner chocolat-noisette', 538, 6, 57, 31, 3.4, [['1 c. à soupe', 15]]],
    ['Chocolat noir 70 %', 570, 8, 33, 42, 11, [['1 carré', 5]]],
    ['Chocolat au lait', 544, 7, 56, 32, 2, [['1 carré', 5]]],
    ['Biscuit sec type petit-beurre', 435, 7.5, 73, 12, 2.5, [['1 biscuit', 8]]],
    ['Glace vanille', 213, 3.5, 25, 11, 0, [['1 boule', 50]]],
  ],
  Sauces: [
    ['Ketchup', 106, 1.2, 25, 0.1, 0, [['1 c. à soupe', 15]]],
    ['Mayonnaise', 693, 1.2, 1, 76, 0, [['1 c. à soupe', 15]]],
    ['Moutarde', 143, 7, 2.5, 11, 3, [['1 c. à café', 5]]],
    ['Sauce soja', 55, 8, 5.5, 0, 0, [['1 c. à soupe', 15]]],
    ['Coulis de tomate', 34, 1.5, 5.5, 0.3, 1.5, [['1 portion', 100]]],
    ['Sauce tomate cuisinée (bocal)', 65, 1.6, 7.5, 2.8, 1.6, [['1 c. à soupe', 15], ['1 portion', 100]]],
    ['Pesto', 449, 5, 5, 45, 2, [['1 c. à soupe', 15]]],
    ['Vinaigrette', 435, 0.2, 3, 47, 0, [['1 c. à soupe', 15]]],
    ['Sauce barbecue', 169, 1, 40, 0.5, 0, [['1 c. à soupe', 15]]],
  ],
  Boissons: [
    ['Café noir', 2, 0.1, 0.3, 0, 0, [['1 tasse', 100], ['1 expresso', 30]], 'ml'],
    ['Jus d’orange', 44, 0.7, 10, 0.1, 0.2, [['1 verre', 200]], 'ml'],
    ['Soda type cola', 42, 0, 10.6, 0, 0, [['1 canette', 330]], 'ml'],
    ['Soda zéro', 0.4, 0, 0, 0, 0, [['1 canette', 330]], 'ml'],
    ['Boisson énergisante', 45, 0, 11, 0, 0, [['1 canette', 250]], 'ml'],
    ['Bière blonde 5 %', 43, 0.4, 3.5, 0, 0, [['1 demi', 250], ['1 bouteille', 330]], 'ml'],
    ['Vin rouge', 82, 0.1, 2.6, 0, 0, [['1 verre', 125]], 'ml'],
  ],
  Compléments: [
    ['Whey protéine', 386, 75, 8, 6, 0, [['1 dose', 30]]],
    ['Whey isolat', 369, 88, 2, 1, 0, [['1 dose', 30]]],
    ['Caséine', 358, 80, 5, 2, 0, [['1 dose', 30]]],
    ['Protéine végétale', 382, 78, 4, 6, 0, [['1 dose', 30]]],
    ['Barre protéinée', 376, 33, 30, 12, 8, [['1 barre', 60]]],
    ['Gainer', 387, 20, 70, 3, 0, [['1 dose', 100]]],
  ],
  'Plats & snacks': [
    ['Pizza margherita', 240, 10, 30, 8.5, 2, [['1/2 pizza', 200], ['1 pizza', 400]]],
    ['Burger (fast-food)', 254, 13, 25, 11, 1.5, [['1 burger', 200]]],
    ['Kebab (sandwich)', 230, 12, 22, 10.5, 1.5, [['1 kebab', 350]]],
    ['Sushis / makis', 150, 6, 28, 1.5, 0.5, [['1 pièce', 30]]],
    ['Lasagnes bolognaise', 149, 8, 13, 7, 1.2, [['1 part', 300]]],
    ['Quiche lorraine', 272, 9, 18, 18, 1, [['1 part', 150]]],
    ['Sandwich jambon-beurre', 261, 11, 33, 9, 2, [['1 sandwich', 180]]],
    ['Chips', 539, 6, 50, 34, 4.5, [['1 petit paquet', 30]]],
  ],
}

const slug = (s: string) => normalize(s).replace(/ /g, '-')

export const BASE_FOODS: Food[] = Object.entries(CATEGORIES).flatMap(([category, rows]) =>
  rows.map(([name, kcal, protein, carbs, fat, fiber, portions, unit]) => ({
    id: `b:${slug(name)}`,
    name,
    source: 'base' as const,
    category,
    unit: unit ?? 'g',
    per100: { kcal, protein, carbs, fat, fiber },
    portions: (portions ?? []).map(([label, grams]): Portion => ({ label, grams })),
  })),
)

export const FOOD_CATEGORIES = Object.keys(CATEGORIES)

const BASE_BY_ID = new Map(BASE_FOODS.map((f) => [f.id, f]))

export function findBaseFood(id: string): Food | undefined {
  return BASE_BY_ID.get(id)
}

/** Recherche locale : tous les mots doivent apparaître (sans accents), les débuts de nom d'abord. */
export function searchFoods(query: string, list: Food[], limit = 40): Food[] {
  const q = normalize(query)
  if (!q) return []
  const words = q.split(' ')
  const scored: { f: Food; score: number }[] = []
  for (const f of list) {
    const name = normalize(f.name)
    const hay = `${name} ${normalize(f.brand ?? '')} ${normalize(f.category ?? '')}`
    if (!words.every((w) => hay.includes(w))) continue
    let score = 0
    if (name.startsWith(q)) score += 100
    else if (name.startsWith(words[0])) score += 50
    if (name.split(' ').some((t) => t === words[0])) score += 20
    score -= name.length / 10
    if (f.source === 'perso' || f.source === 'recette') score += 15
    scored.push({ f, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.f)
}
