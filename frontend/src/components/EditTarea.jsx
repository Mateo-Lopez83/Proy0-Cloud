/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const EditTarea = () => {
  const { idTask } = useParams(); // Get the task ID from the URL
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token || localStorage.getItem('accessToken');

  const [formData, setFormData] = useState({
    texto_tarea: '',
    fecha_tentativa_finalizacion: '',
    estado: '',
    ID_Categoria: '',
  });

  const [categories, setCategories] = useState([]); // Store fetched categories

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`http://localhost:8000/tareas/${idTask}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch task');
        const data = await response.json();
        setFormData(data); // Populate the form with the fetched task data
      } catch (err) {
        console.error('Failed to fetch task:', err);
      }
    };

    fetchTask();
  }, [idTask, token]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/categorias/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:8000/modTarea/${idTask}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto_tarea: formData.texto_tarea,
          fecha_tentativa_finalizacion: formData.fecha_tentativa_finalizacion,
          estado: formData.estado.toLowerCase(), // Convert to lowercase if required by the backend
          ID_Categoria: parseInt(formData.ID_Categoria, 10), // Ensure ID_Categoria is an integer
        }),
      });

      if (!response.ok) throw new Error('Failed to update task');
      navigate('/tasks', { state: { token } }); // Redirect back to the tasks page
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Edit Task</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="texto_tarea" style={styles.label}>Task Description:</label>
          <input
            type="text"
            id="texto_tarea"
            name="texto_tarea"
            value={formData.texto_tarea}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="fecha_tentativa_finalizacion" style={styles.label}>Due Date:</label>
          <input
            type="date"
            id="fecha_tentativa_finalizacion"
            name="fecha_tentativa_finalizacion"
            value={formData.fecha_tentativa_finalizacion}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="estado" style={styles.label}>Status:</label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="Sin Empezar">Sin Empezar</option>
            <option value="Empezada">Empezada</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="ID_Categoria" style={styles.label}>Category:</label>
          <select
            id="ID_Categoria"
            name="ID_Categoria"
            value={formData.ID_Categoria}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.ID} value={category.ID}>
                {category.nombre} - {category.description}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={styles.button}>Update Task</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default EditTarea;
