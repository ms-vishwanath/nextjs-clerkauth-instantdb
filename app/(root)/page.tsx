"use client";

import { SignedIn, useAuth, UserButton } from "@clerk/nextjs";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import { useCallback } from "react";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_DB_ID as string;

const schema = i.schema({
  entities: {
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
      uid: i.string(),
    }),
  },
});

type Todo = InstaQLEntity<typeof schema, "todos">;

const db = init({ appId: APP_ID, schema });

function useTodos(userId: any) {
  console.log("user id", userId);
  const { data, error, isLoading } = db.useQuery({
    todos: {
      $: {
        where: {
          uid: userId,
        },
      },
    },
  });

  const deleteTodo = useCallback((todo: Todo) => {
    db.transact(db.tx.todos[todo.id].delete());
  }, []);

  const toggleDone = useCallback((todo: Todo) => {
    db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
  }, []);

  const deleteCompleted = useCallback((todos: Todo[]) => {
    const completed = todos.filter((todo) => todo.done);
    const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
    db.transact(txs);
  }, []);

  const toggleAll = useCallback((todos: Todo[]) => {
    const newVal = !todos.every((todo) => todo.done);
    db.transact(
      todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
    );
  }, []);

  return {
    data,
    error,
    isLoading,
    deleteTodo,
    toggleDone,
    deleteCompleted,
    toggleAll,
  };
}

function TodoForm({
  addTodo,
  toggleAll,
  todos,
}: {
  addTodo: (text: string) => void;
  toggleAll: () => void;
  todos: Todo[];
}) {
  return (
    <div style={styles.form}>
      <div style={styles.toggleAll} onClick={toggleAll}>
        ⌄
      </div>
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const input = e.currentTarget.elements[0] as HTMLInputElement;
          addTodo(input.value);
          input.value = "";
        }}
      >
        <input
          style={styles.input}
          autoFocus
          placeholder="What needs to be done?"
          type="text"
        />
      </form>
    </div>
  );
}

function TodoList({
  todos,
  toggleDone,
  deleteTodo,
}: {
  todos: Todo[];
  toggleDone: (todo: Todo) => void;
  deleteTodo: (todo: Todo) => void;
}) {
  return (
    <div style={styles.todoList}>
      {todos.map((todo) => (
        <div key={todo.id} style={styles.todo}>
          <input
            type="checkbox"
            style={styles.checkbox}
            checked={todo.done}
            onChange={() => toggleDone(todo)}
          />
          <div style={styles.todoText}>
            <span style={todo.done ? { textDecoration: "line-through" } : {}}>
              {todo.text}
            </span>
          </div>
          <span onClick={() => deleteTodo(todo)} style={styles.delete}>
            𝘟
          </span>
        </div>
      ))}
    </div>
  );
}

function ActionBar({
  todos,
  deleteCompleted,
}: {
  todos: Todo[];
  deleteCompleted: (todos: Todo[]) => void;
}) {
  return (
    <div style={styles.actionBar}>
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <div style={{ cursor: "pointer" }} onClick={() => deleteCompleted(todos)}>
        Delete Completed
      </div>
    </div>
  );
}

export default function App() {
  const { userId } = useAuth();
  const {
    data,
    error,
    isLoading,
    deleteTodo,
    toggleDone,
    deleteCompleted,
    toggleAll,
  } = useTodos(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error querying data: {error.message}</div>;

  const todos = data?.todos || [];

  const addTodo = (text: string) => {
    db.transact(
      db.tx.todos[id()].update({
        text,
        done: false,
        createdAt: Date.now(),
        uid: userId || "",
      })
    );
  };

  return (
    <div className="flex flex-col">
      <SignedIn>
        <div className="flex justify-end p-4">
          <UserButton />
        </div>
        <div className="flex justify-center flex-col items-center">
          <div style={styles.header}>todos</div>
          <TodoForm
            addTodo={addTodo}
            toggleAll={() => toggleAll(todos)}
            todos={todos}
          />
          <TodoList
            todos={todos}
            toggleDone={toggleDone}
            deleteTodo={deleteTodo}
          />
          <ActionBar todos={todos} deleteCompleted={deleteCompleted} />
        </div>
      </SignedIn>
    </div>
  );
}
// Write Data
// ---------

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
  container: {
    boxSizing: "border-box",
    fontFamily: "code, monospace",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  header: {
    letterSpacing: "2px",
    fontSize: "50px",
    color: "lightgray",
    marginBottom: "10px",
  },
  form: {
    boxSizing: "inherit",
    display: "flex",
    border: "1px solid lightgray",
    borderBottomWidth: "0px",
    width: "350px",
  },
  toggleAll: {
    fontSize: "30px",
    cursor: "pointer",
    marginLeft: "11px",
    marginTop: "-6px",
    width: "15px",
    marginRight: "12px",
  },
  input: {
    backgroundColor: "transparent",
    fontFamily: "code, monospace",
    width: "287px",
    padding: "10px",
    fontStyle: "italic",
  },
  todoList: {
    boxSizing: "inherit",
    width: "350px",
  },
  checkbox: {
    fontSize: "30px",
    marginLeft: "5px",
    marginRight: "20px",
    cursor: "pointer",
  },
  todo: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    border: "1px solid lightgray",
    borderBottomWidth: "0px",
  },
  todoText: {
    flexGrow: "1",
    overflow: "hidden",
  },
  delete: {
    width: "25px",
    cursor: "pointer",
    color: "lightgray",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    width: "328px",
    padding: "10px",
    border: "1px solid lightgray",
    fontSize: "10px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "10px",
  },
};
