import React, { useEffect, useReducer } from 'react';

import API, { graphqlOperation } from '@aws-amplify/api';
import PubSub from '@aws-amplify/pubsub';

import { createTodo } from '/graphql/mutations';
import { listTodos } from './graphql/queries';
import { onCreateTod } from './graphql/subscriptions';

import awsconfig from './aws-exports';
import './App.css';

API.configure(awsconfig);
PubSub.configure(awsconfig);

const QUERY = "QUERY";
const SUBSCRIPTION = "SUBSCRIPTION";

const initialState = {
  todos: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case QUERY:
      return {...state, todos: action.todos};
    case SUBSCRIPTION:
      return {...state, todos:[...state.todos, action.todo]}
    default:
      return state;
  }
};

async function createNewTodo() {
  const todo = { name: "Use AWS AppSync", description: "Realtime and Offline" };
  await API.graphql(graphqlOperation(createTodo, { input: todo }));
}


function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function getData() {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      dispatch({ type: QUERY, todos: todoData.datalistTodos.items });
    }
    getData();

    const subscription = API.graphql(graphqlOperation(onCreateTod)).subscribe({
      next: (eventData) => {
        const todo = eventData.value.data.onCreateTod;
        dispatch({ type: SUBSCRIPTION, todo });
      }
    });

    return () => subscription.unsubscribe();
  }, [])
  return (
    <div className="App">
      <button onClick={createNewTodo}>Add Todo</button>
      <div>
        {state.todos.length > 0 ?
          state.todos.map((todo) => <p key={todo.id}>{todo.name} : {todo.description}</p>):
          <p>Add some todos!</p>
        }
      </div>
    </div>
  );
}

export default App;
