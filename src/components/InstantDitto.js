import { useQuery, tx, transact, id } from "@instantdb/react";

import { TODAY, isToday, extractDate } from "../utils/date";
import Ditto from "./Ditto";

function generateTodos(masterTodos, date) {
  const ts = new Date();
  transact(
    masterTodos.map((t) =>
      tx.todos[id()].update({
        masterId: t.id,
        label: t.label,
        createdAt: ts.getTime(),
        createdForDate: date,
        order: t.order,
      })
    )
  );
}

function createTodo(activeDate, label, order) {
  const todoId = id();
  const ts = new Date();
  if (isToday(activeDate)) {
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
        createdForDate: extractDate(activeDate),
        order,
      }),
    ]);
  }
}

function toggleTodo(todo, newData) {
  transact([tx.todos[todo.id].update(newData)]);
}

function updateTodo(todo, newData) {
  const masterTx = isToday(new Date(todo.createdForDate))
    ? [tx.masterTodos[todo.masterId].update(newData)]
    : [];
  transact(masterTx.concat([tx.todos[todo.id].update(newData)]));
}

function deleteTodo(todo) {
  const masterTx = isToday(new Date(todo.createdForDate))
    ? [tx.masterTodos[todo.masterId].delete()]
    : [];
  transact(masterTx.concat([tx.todos[todo.id].delete()]));
}

function deleteTodos(todos) {
  todos.map((t) => deleteTodo(t));
}

function InstantDitto() {
  const { isLoading, error, data } = useQuery({ todos: {}, masterTodos: {} });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Ditto
      useFetchData={() => data}
      generateTodos={generateTodos}
      createTodo={createTodo}
      updateTodo={updateTodo}
      deleteTodos={deleteTodos}
      toggleTodo={toggleTodo}
    />
  );
}

export default InstantDitto;
