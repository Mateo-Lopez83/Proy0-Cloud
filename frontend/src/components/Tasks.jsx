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
  const handleDeleteTask = async (idTarea) => {
    try {
      const response = await fetch(`http://localhost:8000/borrarTarea/${idTarea}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      // Remove the deleted task from the state
      setTasks((prevTasks) => prevTasks.filter((task) => task.ID !== idTarea));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Tus Tareas</h1>
      {tasks.length === 0 ? (
        <p style={styles.p}>No hay tareas actualmente.</p>
      ) : (
        <>
          <div style={styles.taskList}>
            {currentTasks.map((task) => (
              <div key={task.ID} style={styles.taskCard}>
                <div style={styles.taskContent}>
                  <h3
                    style={styles.taskTitle}
                    onClick={() => navigate(`/editTarea/${task.ID}`, { state: { token } })}
                  >
                    {categories[task.ID_Categoria] || 'Loading...'} - {task.texto_tarea}
                  </h3>
                  <p style={styles.p}><strong>Estado:</strong> {task.estado}</p>
                  <p style={styles.p}><strong>Fecha de creación:</strong> {task.fecha_creacion}</p>
                  <p style={styles.p}><strong>Fecha estimada:</strong> {task.fecha_tentativa_finalizacion}</p>
                </div>
                <button
                  style={styles.checkmarkButton}
                  onClick={() => handleDeleteTask(task.ID)}
                >
                  ✅
                </button>
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
      {/* Crear Categoria Button */}
      <button
        style={styles.crearCategoriaButton}
        onClick={() => navigate('/nuevaCategoria', { state: { token } })}
      >
        Crear Categoria
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
    position: 'relative', // For positioning the buttons
  },
  p: {
    color: 'black',
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1, // Allow the content to take up available space
  },
  taskTitle: {
    margin: '0 0 10px 0',
    color: '#007bff',
  },
  checkmarkButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    marginLeft: '10px', // Add some spacing between the content and the button
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
  crearCategoriaButton: {
    position: 'fixed',
    bottom: '20px',
    right: '90px', // Positioned to the left of the plus button
    padding: '10px 20px',
    borderRadius: '25px',
    backgroundColor: '#ffcc00', // Yellow color
    color: '#000',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

export default Tasks;