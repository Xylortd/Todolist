'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}s`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const deadlineDate = new Date(formValues[1]);
      if (deadlineDate < new Date()) {
        Swal.fire('Error', 'Deadline tidak boleh di masa lalu', 'error');
        return;
      }

      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
      Swal.fire('Sukses!', 'Tugas berhasil ditambahkan.', 'success');
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
    Swal.fire('Berhasil!', 'Tugas berhasil dihapus.', 'success');
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html: `
        <input id="swal-input1" class="swal2-input" value="${task.text}">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value,
        ];
      },
    });

    if (formValues) {
      const [newText, newDeadline] = formValues;
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        text: newText,
        deadline: newDeadline,
      });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, text: newText, deadline: newDeadline } : t));
      Swal.fire('Berhasil!', 'Tugas berhasil diperbarui.', 'success');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-center text-purple-600 mb-6">To-Do List</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-gradient-to-r from-emerald-500 to-green-400 text-white font-semibold px-6 py-2 rounded-full shadow hover:scale-105 transition-transform"
        >
          Tambah Tugas
        </button>
      </div>
      {loading ? (
        <p className="text-center text-gray-500">Memuat tugas...</p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {sortedTasks.map((task) => {
              const timeLeft = calculateTimeRemaining(task.deadline);
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColor = task.completed
                ? 'bg-green-200 border-green-400'
                : isExpired
                ? 'bg-red-200 border-red-400'
                : 'bg-yellow-100 border-yellow-300';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`border-l-4 ${taskColor} px-4 py-2 rounded shadow-sm`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer block w-2/3 ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'font-medium text-gray-800'
                      }`}
                    >
                      {task.text}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editTask(task)}
                        className="text-xs bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-xs bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Deadline: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
