import { Redirect } from 'expo-router';
import { APP_ROUTES } from '../../util/appRoutes';

export default function FavouritesRedirect() {
  return <Redirect href={APP_ROUTES.tabs.library} />;
}
