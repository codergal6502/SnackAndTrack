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
    element: <FoodItemForm />,
  },
];

export default AppRoutes;
