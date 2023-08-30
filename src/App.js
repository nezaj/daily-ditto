import { init } from "@instantdb/react";

import LocalDitto from "./components/LocalDitto";
import InstantDitto from "./components//InstantDitto";

const APP_ID = "e8a4ab79-fce6-4372-bf04-c3ba7ad98d33";

init({
  appId: APP_ID,
  websocketURI: "wss://api.instantdb.com/runtime/session",
});

function App() {
  return <InstantDitto />;
}

export default App;
