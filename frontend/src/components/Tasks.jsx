/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token || localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/tareas', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');
        const data = await response.json();
        setTasks(data);

        const categoryIds = [...new Set(data.map((task) => task.ID_Categoria))];
        fetchCategories(categoryIds);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };

    const fetchCategories = async (categoryIds) => {
      try {
        const categoryPromises = categoryIds.map((id) =>
          fetch(`http://localhost:8000/categorias/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error('Failed to fetch category');
            return res.text();
          })
        );

        const categoryResults = await Promise.all(categoryPromises);
        const categoryMap = categoryIds.reduce((acc, id, index) => {
          acc[id] = categoryResults[index];
          return acc;
        }, {});

        setCategories(categoryMap);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchTasks();
  }, [token, navigate]);

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Your Tasks</h1>
      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <>
          <div style={styles.taskList}>
            {currentTasks.map((task) => (
              <div key={task.ID} style={styles.taskCard}>
                <h3 style={styles.taskTitle}>
                  {categories[task.ID_Categoria] || 'Loading...'} - {task.texto_tarea}
                </h3>
                <p><strong>Fecha de creación:</strong> {task.fecha_creacion}</p>
                <p><strong>Fecha estimada:</strong> {task.fecha_tentativa_finalizacion}</p>
              </div>
            ))}
          </div>
          <Pagination
            tasksPerPage={tasksPerPage}
            totalTasks={tasks.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        </>
      )}
      {/* Plus Button */}
      <button
        style={styles.plusButton}
        onClick={() => navigate('/nuevaTarea', { state: { token } })}
      >
        +
      </button>
    </div>
  );
};

const Pagination = ({ tasksPerPage, totalTasks, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalTasks / tasksPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul style={styles.pagination}>
        {pageNumbers.map((number) => (
          <li key={number} style={styles.pageItem}>
            <button
              onClick={() => paginate(number)}
              style={{
                ...styles.pageLink,
                backgroundColor: number === currentPage ? '#007bff' : '#fff',
                color: number === currentPage ? '#fff' : '#007bff',
              }}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative', // For positioning the plus button
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  taskCard: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  taskTitle: {
    margin: '0 0 10px 0',
    color: '#007bff',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    listStyle: 'none',
    padding: '0',
    margin: '20px 0',
  },
  pageItem: {
    margin: '0 5px',
  },
  pageLink: {
    padding: '8px 12px',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s, color 0.2s',
  },
  plusButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

export default Tasks;