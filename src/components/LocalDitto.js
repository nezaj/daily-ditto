import { useState } from "react";
import { id } from "@instantdb/react";

import Ditto from "components/Ditto";
import { TODAY, isToday, extractDate } from "utils/date";

const LOCAL_STORAGE_KEY = "__LOCAL_DITTO";

function saveStorage(data) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
}

function fetchStorage() {
  const defaults = {todos: [], masterTodos: []}
  const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    saveStorage(defaults);
    return defaults;
  }

  return JSON.parse(data);
}

function updateCollection(collection, newData) {
  return newData.reduce((acc, datom) => {
    const entry = acc.find(x => x.id === datom.id) || {};
    const newEntry = {...entry, ...datom}
    return acc.filter(x => x.id !== datom.id).concat(newEntry);
  }, collection)
}

function updateStorage(setData, txs) {
  const data = fetchStorage();
  const newData = txs.reduce((acc, tx) => {
    const [ns, txData] = tx;
    const update = updateCollection(acc[ns], txData);
    return {...acc, [ns]: update}
  }, data)
  saveStorage(newData);
  setData(newData);
}

function deleteFromStorage(setData, txs) {
  const data = fetchStorage();
  const newData = txs.reduce((acc, tx) => {
    const [ns, id] = tx;
    const updated = acc[ns].filter(x => x.id !== id);
    return {...acc, [ns]: updated}
  }, data)
  saveStorage(newData);
  setData(newData);
}

function generateTodos(setData, masterTodos, date) {
  const ts = new Date();
  const newTodos = masterTodos.map((t) => {
    return {
      id: id(),
      masterId: t.id,
      label: t.label,
      createdAt: ts.getTime(),
      createdForDate: date,
      order: t.order,
    }
  });
  updateStorage(setData, [["todos", newTodos]])
}

function createTodo(setData, activeDate, label, order) {
  const todoId = id();
  const ts = new Date();
  if (isToday(activeDate)) {
    const masterId = id();
    updateStorage(setData, [
      ["masterTodos", [{
        id: masterId,
        label,
        createdAt: ts.getTime(),
        startDate: extractDate(TODAY),
        order
      }]],
      ["todos", [{
        id: todoId,
        masterId,
        label,
        createdAt: ts.getTime(),
        createdForDate: extractDate(TODAY),
        order,
      }]]
    ])
  } else {
    updateStorage(setData, [
      ["todos", [{
        id: todoId,
        label,
        createdAt: ts.getTime(),
        createdForDate: extractDate(TODAY),
        order,
      }]]
    ])
  }
}

function updateTodo(setData, todo, newData) {
  const masterTx = isToday(new Date(todo.createdForDate))
    ? [["masterTodos", [{id: todo.masterId, ...newData}]]]
    : [];
  const updateData = masterTx.concat([
    ["todos", [{id: todo.id, ...newData}]]
  ]);
  updateStorage(setData, updateData);
}

function deleteTodo(setData, todo) {
  const masterTx = isToday(new Date(todo.createdForDate))
    ? [["masterTodos", todo.masterId]]
    : [];
  const deleteData = masterTx.concat([
    ["todos", todo.id]
  ]);
  deleteFromStorage(setData, deleteData);
}

function deleteTodos(setData, todos) {
  todos.map(t => deleteTodo(setData, t))
}

function toggleTodo(setData, todo, newData) {
  const updateData = [["todos", [{id: todo.id, ...newData}]]];
  updateStorage(setData, updateData);
}

function LocalDitto() {
  const [data, setData] = useState(fetchStorage())
  return <Ditto
    useFetchData={() => data}
    generateTodos={(masterTodos, date) => generateTodos(setData, masterTodos, date)}
    createTodo={(activeDate, label, order) => createTodo(setData, activeDate, label, order)}
    updateTodo={(todo, newData) => updateTodo(setData, todo, newData)}
    deleteTodos={(todos) => deleteTodos(setData, todos)}
    toggleTodo={(todo, newData) => toggleTodo(setData, todo, newData)}
    />;
}

export default LocalDitto;
