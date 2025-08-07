import { Home } from "./components/Home";
import FoodItemList from './components/FoodItemList';
import FoodItemForm from "./components/FoodItemForm";
import RecipeList from "./components/RecipeList";
import RecipeForm from "./components/RecipeForm";
import RecipeCompute from "./components/RecipeCompute";
import NutritionGoalSetList from "./components/NutritionGoalSetList";
import NutritionGoalSetForm from "./components/NutritionGoalSetForm";
import FoodJournal from "./components/FoodJournal";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/foodjournal',
    element: <FoodJournal />
  },
  {
    path: '/fooditemlist',
    element: <FoodItemList />
  },
  {
    path: '/fooditemform',
    element: <FoodItemForm />
  },
  {
    path: '/fooditemform/:id',
    element: <FoodItemForm />,
  },
  {
    path: '/recipelist',
    element: <RecipeList />
  },
  {
    path: '/recipeForm',
    element: <RecipeForm />
  },
  {
    path: '/recipeForm/:id',
    element: <RecipeForm />
  },
  {
    path: '/recipecompute/:id',
    element: <RecipeCompute />
  },
  {
    path: '/nutritionGoalSetList',
    element: <NutritionGoalSetList />
  },
  {
    path: '/nutritiongoalsetform',
    element: <NutritionGoalSetForm />
  },
  {
    path: '/nutritiongoalsetform/:id',
    element: <NutritionGoalSetForm />
  },
];

export default AppRoutes;
