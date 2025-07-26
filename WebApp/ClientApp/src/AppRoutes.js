import { Home } from "./components/Home";
import FoodItemList from './components/FoodItemList';
import FoodItemForm from "./components/FoodItemForm";
import RecipeList from "./components/RecipeList";
import RecipeForm from "./components/RecipeForm";

const AppRoutes = [
  {
    index: true,
    element: <Home />
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
];

export default AppRoutes;
