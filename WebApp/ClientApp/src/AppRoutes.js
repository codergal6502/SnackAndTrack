// import { Counter } from "./components/Counter";
// import { FetchData } from "./components/FetchData";
import { Home } from "./components/Home";
import FoodItemList from './components/FoodItemList';
import FoodItemForm from "./components/FoodItemForm";

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
    element: <FoodItemForm />, // Route to display the form for editing an existing food item
  },
];

export default AppRoutes;
