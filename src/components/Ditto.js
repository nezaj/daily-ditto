import { useState, useRef, useEffect } from "react";
import { tx, transact } from "@instantdb/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TODAY, isToday, extractDate, friendlyDate, minDate } from "utils/date";

import { addDays, subDays, isAfter } from "date-fns";

// Styles
// -------------
const inputStyle = "outline outline-2 mr-2 px-2";

// Functions
// -------------
function onDragEnd(result, todos, updateTodo) {
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

  const todo = todos[source.index];
  updateTodo(todo, {order: newOrder});
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

function getAgendaForDate(allTodos, agendaDate) {
  return allTodos.filter((t) => t.createdForDate === agendaDate);
}

function isVictory(todos) {
  return todos.length && todos.every((t) => t.done === "true");
}

function calculateStreaks(allTodos, activeDate) {
  const startDate = new Date(minDate(allTodos.map((t) => t.createdForDate)));
  let currDate = subDays(activeDate, 1);
  let streak = 0;
  let tempAgenda = null;
  let breakStreak = false;
  while (isAfter(currDate, startDate) && !breakStreak) {
    tempAgenda = getAgendaForDate(allTodos, extractDate(currDate));
    if (!tempAgenda.length) {
      currDate = subDays(currDate, 1);
    } else if (isVictory(tempAgenda)) {
      streak += 1;
      currDate = subDays(currDate, 1);
    } else {
      breakStreak = true;
    }
  }

  return streak;
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

function DateNav({ activeDate, setActiveDate }) {
  return (
    <div className="grid grid-flow-col my-4">
      <button
        className="justify-self-start"
        onClick={() => setActiveDate(addDays(activeDate, -1))}
      >
        {"<"}
      </button>
      <span className="justify-self-center">
        {friendlyDate(extractDate(activeDate))}
      </span>
      {true || !isToday(activeDate) ? (
        <button
          className="justify-self-end"
          onClick={() => setActiveDate(addDays(activeDate, 1))}
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

function StreakMessage({ streak }) {
  return (
    streak > 0 && (
      <div className="mb-4">
        <div className="text-lg text-center mb-2">🔥 {streak}</div>
      </div>
    )
  );
}

function IncompleteTasksMessage({ streak }) {
  return (
    <div className="mb-4">
      <StreakMessage streak={streak} />
    </div>
  );
}

function AllTasksCompleteMessage({ streak }) {
  return (
    <div className="mb-4">
      <StreakMessage streak={streak} />
      <div className="text-lg text-center mb-2">
        All tasks complete, you rock!
      </div>
    </div>
  );
}

const copiedDates = new Set();

function Ditto({
  fetchData,
  generateTodos,
  createTodo,
  updateTodo,
  deleteTodos,
  toggleTodo,
}) {
  const [activeDate, setActiveDate] = useState(TODAY);
  const { todos, masterTodos } = fetchData();
  const streak = calculateStreaks(todos, activeDate);

  const activeTodos = todos
    .filter((x) => x.createdForDate === extractDate(activeDate))
    .sort((a, b) => a.order - b.order);
  const todoRef = useRef(null);
  const [updateList, setUpdateList] = useState([]);

  useEffect(() => {
    const date = extractDate(activeDate);
    if (!isAfter(activeDate, TODAY)) {
      return;
    }
    if (copiedDates.has(date)) {
      return;
    }
    if (activeTodos.length) {
      copiedDates.add(date);
      return;
    }
    if (masterTodos.length && !activeTodos.length) {
      generateTodos(masterTodos, date);
      copiedDates.add(date);
    }
  }, [masterTodos.length, activeTodos.length, activeDate]);

  return (
    <div className="w-96 mx-auto px-4">
      <Devbar />
      <DateNav activeDate={activeDate} setActiveDate={setActiveDate} />
      <DragDropContext
        onDragEnd={(result) => onDragEnd(result, todos, updateTodo)}
      >
        <Droppable droppableId="todos">
          {(pDrop) => (
            <div ref={pDrop.innerRef} {...pDrop.droppableProps}>
              {activeTodos.map((x, idx) => (
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
                            toggleTodo(x, {
                              done: x.done === "true" ? "false" : "true",
                            });
                          }}
                          checked={x.done === "true" ? "checked" : ""}
                        />
                        {updateList.indexOf(x.id) !== -1 ? (
                          <form
                            className="inline-block"
                            onSubmit={(e) => e.preventDefault()}
                          >
                            <input
                              className={inputStyle}
                              defaultValue={x.label}
                              id="updateTodo"
                              onBlur={() => {
                                const newData = {label: document.getElementById("editTodo").value}
                                updateTodo(x, newData, updateList, setUpdateList)
                                setUpdateList(updateList.filter((id) => id !== x.id));

                              }}
                              autoFocus
                            />
                            <Button
                              label="Update"
                              onClick={() => {
                                const newData = {label: document.getElementById("editTodo").value}
                                updateTodo(x, newData, updateList, setUpdateList)
                                setUpdateList(updateList.filter((id) => id !== x.id));

                              }}
                            />
                          </form>
                        ) : (
                          <>
                            <span
                              onClick={() => setUpdateList([...updateList, x.id])}
                              className="mx-2 my-auto"
                            >
                              {x.label}
                            </span>
                            <Button
                              onClick={() => deleteTodos([x])}
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
      {isToday(activeDate) && (
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
                  const order = lastOrder(todos);
                  createTodo(activeDate, label, order);
                  todoRef.current.value = null;
                }}
                label="Add Todo"
              />
            </form>
          </span>
          <Button onClick={(_) => deleteTodos(activeTodos)} label="Purge" />
        </>
      )}
      {isVictory(todos) ? (
        <AllTasksCompleteMessage streak={streak + 1} />
      ) : (
        <IncompleteTasksMessage streak={streak} />
      )}
    </div>
  );
}

export default Ditto;
