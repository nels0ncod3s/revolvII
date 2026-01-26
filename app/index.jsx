import { Redirect} from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/home" />; //redirect to home tab
}