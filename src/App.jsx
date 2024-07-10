import { useState } from "react";
import "./index.css";

function App() {
  const [inputJson, setInputJson] = useState("");
  const [resultJson, setResultJson] = useState("");

  function convertJson(val) {
    setInputJson(val);
    if (val.trim() === "") {
      setResultJson("");
      return;
    }
    try {
      const parsedInput = JSON.parse(val);
      const actions =
        parsedInput["resources"][0]["properties"]["definition"]["actions"];
      const sortedActions = sortActions(actions);
      parsedInput["resources"][0]["properties"]["definition"]["actions"] =
        sortedActions;
      setResultJson(JSON.stringify(parsedInput, null, 2));
    } catch (e) {
      setResultJson(
        "JSON is invalid, please enter a valid JSON in the input field."
      );
    }
  }

  function sortActions(actions) {
    // Helper function to check if a node has been visited
    function hasCycle(node, visited, stack) {
      if (!visited[node]) {
        visited[node] = true;
        stack[node] = true;
        if (actions[node].runAfter) {
          for (let dependency in actions[node].runAfter) {
            if (!visited[dependency] && hasCycle(dependency, visited, stack)) {
              return true;
            } else if (stack[dependency]) {
              return true;
            }
          }
        }
      }
      stack[node] = false;
      return false;
    }

    // Check for cycles
    let visited = {};
    let stack = {};
    for (let action in actions) {
      if (hasCycle(action, visited, stack)) {
        throw new Error("Cycle detected in actions");
      }
    }

    // Topological sort using Depth First Search
    let sorted = [];
    visited = {};

    function topologicalSort(node) {
      visited[node] = true;
      if (actions[node].runAfter) {
        for (let dependency in actions[node].runAfter) {
          if (!visited[dependency]) {
            topologicalSort(dependency);
          }
        }
      }
      sorted.push(node);
    }

    for (let action in actions) {
      if (!visited[action]) {
        topologicalSort(action);
      }
    }

    // Create sorted actions object
    let sortedActions = {};
    sorted.forEach((action) => {
      // Recursively sort nested actions if they exist
      if (actions[action].actions) {
        actions[action].actions = sortActions(actions[action].actions);
      }
      sortedActions[action] = actions[action];
    });

    return sortedActions;
  }

  return (
    <div className="main-container">
      <div className="header-container">
        <img src="logic-apps-icon.png" alt="Logic Apps Icon" />
        <h1>Action Sorter</h1>
      </div>
      <div className="textbox-container">
        <textarea
          value={inputJson}
          placeholder="Please enter Logic App JSON template."
          onChange={(event) => convertJson(event.target.value)}
          className="json-textarea"
        ></textarea>

        <textarea
          value={resultJson}
          placeholder="Sorted Logic App JSON template:"
          readOnly
          className="json-textarea"
        ></textarea>
      </div>
    </div>
  );
}

export default App;
