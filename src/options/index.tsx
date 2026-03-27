import { useState } from "react";

import "./style.css";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";

import Header from "~options/components/Header";
import Sidebar from "~options/components/Sidebar";
import { RouteContext, routes } from "~options/routes/routes";

function OptionsIndex() {
  const [route, setRoute] = useState(routes.Settings);

  return (
    <FluentProvider theme={webLightTheme}>
      <div className="flex flex-col relative z-10">
        <RouteContext.Provider value={{ route, setRoute }}>
          <Header />
          <div className="flex h-[calc(100vh-4rem)]">
            {/*<Sidebar />*/}
            <div className="flex-grow p-3">{route.page}</div>
          </div>
        </RouteContext.Provider>
      </div>
    </FluentProvider>
  );
}

export default OptionsIndex;
