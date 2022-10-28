import { useInit } from "@instantdb/react";

import InstantDitto from "components/InstantDitto";

// Consts
// -------------
const APP_ID = "e8a4ab79-fce6-4372-bf04-c3ba7ad98d33";

// Styles
// -------------
function App() {
  const [isLoading, error, _] = useInit({
    appId: APP_ID,
    websocketURI: "wss://instant-server.herokuapp.com/api",
    apiURI: "https://instant-server.herokuapp.com/api",
  });
  if (isLoading) {
    return <div>...</div>;
  }
  if (error) {
    return <div>Oi! {error?.message}</div>;
  }
  return <InstantDitto />;
}

export default App;
