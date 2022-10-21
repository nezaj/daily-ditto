import { useState, useRef, useEffect } from "react";
import { useInit, useQuery, tx, transact, id } from "@instantdb/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TODAY, isToday, extractDate, friendlyDate, addDays } from "utils/date";

// Consts
// -------------
const APP_ID = "e8a4ab79-fce6-4372-bf04-c3ba7ad98d33";

// Styles
// -------------
const inputStyle = "outline outline-2 mr-2 px-2";

function deleteTodo(t) {
  const masterTx = isToday(new Date(t.createdForDate))
    ? [tx.masterTodos[t.masterId].delete()]
    : [];
  transact(masterTx.concat([tx.todos[t.id].delete()]));
}

function editTodo(t, editList, setEditList) {
  const label = document.getElementById("editTodo").value;
  const masterTx = isToday(new Date(t.createdForDate))
    ? [tx.masterTodos[t.masterId].update({ label })]
    : [];
  transact(
    masterTx.concat([
      tx.todos[t.id].update({
        label,
      }),
    ])
  );
  setEditList(editList.filter((id) => id !== t.id));
}

function onDragEnd(result, todos) {
  const { destination, source } = result;

  if (!destination) {
    return;
  }

  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) {
    return;
  }

  let newOrder;
  if (destination.index === 0) {
    newOrder = firstOrder(todos);
  } else if (destination.index === todos.length - 1) {
    newOrder = lastOrder(todos);
  } else if (destination.index > source.index) {
    newOrder =
      (todos[destination.index].order + todos[destination.index + 1].order) /
      2.0;
  } else if (destination.index < source.index) {
    newOrder =
      (todos[destination.index - 1].order + todos[destination.index].order) /
      2.0;
  } else {
    console.log("Oi! This shouldn't happen! Ping Joe @ joeaverbukh@gmail.com");
  }

  const { id, masterId, createdForDate } = todos[source.index];
  const masterTx = isToday(new Date(createdForDate))
    ? [tx.masterTodos[masterId].update({ order: newOrder })]
    : [];
  transact(masterTx.concat([tx.todos[id].update({ order: newOrder })]));
}

function firstOrder(todos) {
  if (!todos.length) {
    return 0;
  }

  return Math.min(...todos.map((x) => x.order)) - 1;
}

function lastOrder(todos) {
  if (!todos.length) {
    return 0;
  }

  return Math.max(...todos.map((x) => x.order)) + 1;
}

// Components
// -------------
function Button({ onClick, label }) {
  return (
    <button className="border-2 px-4 py-2" onClick={onClick}>
      {label}
    </button>
  );
}

function Handle({ handleProps }) {
  return (
    <div className="w-8 h-8 ml-4 my-auto" {...handleProps}>
      <div className="w-6 h-1 bg-slate-500 mt-2 mx-1" />
      <div className="w-6 h-1 bg-slate-500 mt-1 mx-1" />
      <div className="w-6 h-1 bg-slate-500 mt-1 mx-1" />
    </div>
  );
}

function DateHeader({ displayDate, setDisplayDate }) {
  return (
    <div className="grid grid-flow-col my-4">
      <button
        className="justify-self-start"
        onClick={() => setDisplayDate(addDays(displayDate, -1))}
      >
        {"<"}
      </button>
      <span className="justify-self-center">
        {friendlyDate(extractDate(displayDate))}
      </span>
      {true || !isToday(displayDate) ? (
        <button
          className="justify-self-end"
          onClick={() => setDisplayDate(addDays(displayDate, 1))}
        >
          {">"}
        </button>
      ) : (
        <div></div>
      )}
    </div>
  );
}

function Devbar() {
  return (
    window.location.hostname === "localhost" && (
      <div className="my-4 text-center bg-teal-200">DEVELOPMENT</div>
    )
  );
}

function Main() {
  const [displayDate, setDisplayDate] = useState(TODAY);
  const data = useQuery({
    todos: {},
    masterTodos: {},
  });
  const todos = data["todos"]
    .filter((x) => x.createdForDate === extractDate(displayDate))
    .sort((a, b) => a.order - b.order);
  const masterTodos = data["masterTodos"].filter(
    (x) => new Date(x.startDate) <= new Date(extractDate(displayDate))
  );
  console.log(masterTodos);

  const todoRef = useRef(null);
  const [editList, setEditList] = useState([]);
  useEffect(() => {
    if (masterTodos.length && !todos.length) {
      const ts = new Date();
      transact(
        masterTodos.map((t) =>
          tx.todos[id()].update({
            label: t.label,
            createdAt: ts.getTime(),
            createdForDate: extractDate(displayDate),
            order: t.order,
          })
        )
      );
    }
  }, [masterTodos.length, todos.length, displayDate]);

  // Create instances of todos at runtime for new days

  return (
    <div className="w-96 mx-auto px-4">
      <Devbar />
      <DateHeader displayDate={displayDate} setDisplayDate={setDisplayDate} />
      <DragDropContext onDragEnd={(result) => onDragEnd(result, todos)}>
        <Droppable droppableId="todos">
          {(pDrop) => (
            <div ref={pDrop.innerRef} {...pDrop.droppableProps}>
              {todos.map((x, idx) => (
                <Draggable key={x.id} draggableId={x.id} index={idx}>
                  {(pDrag) => (
                    <div
                      className="my-2"
                      {...pDrag.draggableProps}
                      ref={pDrag.innerRef}
                    >
                      <div className="flex">
                        <input
                          className="mx-2 my-auto"
                          type="checkbox"
                          onChange={(_) => {
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
                              className="mx-2 my-auto"
                            >
                              {x.label}
                            </span>
                            <Button
                              onClick={() => deleteTodo(x)}
                              label="Delete"
                            />
                          </>
                        )}
                        <Handle handleProps={pDrag.dragHandleProps} />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {pDrop.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {(true || isToday(displayDate)) && (
        <>
          <span>
            <form onSubmit={(e) => e.preventDefault()}>
              <input className={inputStyle} ref={todoRef}></input>
              <Button
                onClick={() => {
                  const label = todoRef.current?.value;
                  if (!label) {
                    return;
                  }
                  const todoId = id();
                  const order = lastOrder(todos);
                  const ts = new Date();
                  // Create master todo if adding todo for today's date
                  if (isToday(displayDate)) {
                    const masterId = id();
                    transact([
                      tx.masterTodos[masterId].update({
                        label,
                        createdAt: ts.getTime(),
                        startDate: extractDate(TODAY),
                        order,
                      }),
                      tx.todos[todoId].update({
                        masterId,
                        label,
                        createdAt: ts.getTime(),
                        createdForDate: extractDate(TODAY),
                        order,
                      }),
                    ]);
                  } else {
                    transact([
                      tx.todos[todoId].update({
                        label,
                        createdAt: ts.getTime(),
                        createdForDate: extractDate(displayDate),
                        order,
                      }),
                    ]);
                  }
                  todoRef.current.value = null;
                }}
                label="Add Todo"
              />
            </form>
          </span>
          <Button
            onClick={(e) => transact(todos.map((x) => tx.todos[x.id].delete()))}
            label="Purge"
          />
        </>
      )}
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
