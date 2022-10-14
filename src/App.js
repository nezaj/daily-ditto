import { useState, useRef } from "react";
import { useInit, useQuery, tx, transact, id } from "@instantdb/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Consts
// -------------
const APP_ID = "e8a4ab79-fce6-4372-bf04-c3ba7ad98d33";

// Styles
// -------------
const inputStyle = "outline outline-2 mr-2 px-2";

function editTodo(x, editList, setEditList) {
  const label = document.getElementById("editTodo").value;
  transact([
    tx.todos[x.id].update({
      label,
    }),
  ]);
  setEditList(editList.filter((id) => id !== x.id));
}

function onDragEnd(result) {}

// Components
// -------------
function Button({ onClick, label }) {
  return (
    <button className="border-2 px-4 py-2" onClick={onClick}>
      {label}
    </button>
  );
}

function Main() {
  const data = useQuery({ todos: {} });
  const todos = data["todos"].sort((a, b) => a.ts - b.ts);
  console.log(todos.map((x) => x.ts));
  const todoRef = useRef(null);
  const [editList, setEditList] = useState([]);
  return (
    <div className="mx-8 my-2">
      {window.location.hostname === "localhost" && (
        <div className="my-4 text-center bg-teal-200">DEVELOPMENT</div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {(pDrop) => (
            <div ref={pDrop.innerRef} {...pDrop.droppableProps}>
              {todos.map((x, idx) => (
                <Draggable draggableId={x.id} index={idx}>
                  {(pDrag) => (
                    <div
                      key={x.id}
                      className="my-2"
                      {...pDrag.draggableProps}
                      {...pDrag.dragHandleProps}
                      ref={pDrag.innerRef}
                    >
                      <span>
                        <input
                          className="mx-2"
                          type="checkbox"
                          onClick={(e) => {
                            transact([
                              tx.todos[x.id].update({
                                done: x.done === "true" ? "false" : "true",
                              }),
                            ]);
                          }}
                          checked={x.done === "true" ? "checked" : ""}
                        />
                        {editList.indexOf(x.id) !== -1 ? (
                          <form
                            className="inline-block"
                            onSubmit={(e) => e.preventDefault()}
                          >
                            <input
                              className={inputStyle}
                              defaultValue={x.label}
                              id="editTodo"
                              onBlur={() => editTodo(x, editList, setEditList)}
                              autoFocus
                            />
                            <Button
                              label="Update"
                              onClick={() => editTodo(x, editList, setEditList)}
                            />
                          </form>
                        ) : (
                          <>
                            <span
                              onClick={() => setEditList([...editList, x.id])}
                              className="mx-2 inline-block align-center"
                            >
                              {x.label}
                            </span>
                            <Button
                              onClick={(e) =>
                                transact([tx.todos[x.id].delete()])
                              }
                              label="Delete"
                            />
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {pDrop.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <span>
        <form onSubmit={(e) => e.preventDefault()}>
          <input className={inputStyle} ref={todoRef}></input>
          <Button
            onClick={(e) => {
              const label = todoRef.current?.value;
              if (!label) {
                return;
              }
              const newID = id();
              transact([
                tx.todos[newID].update({ label, ts: new Date().getTime() }),
              ]);
              todoRef.current.value = null;
            }}
            label="Add Todo"
          />
        </form>
      </span>
      <Button
        onClick={(e) => {
          const ids = data["todos"].filter((x) => x.title).map((x) => x.id);
          transact(ids.map((i) => tx.todos[i].delete()));
        }}
        label="Purge"
      />
    </div>
  );
}

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
  return <Main />;
}

export default App;
