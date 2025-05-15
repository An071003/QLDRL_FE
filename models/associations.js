const Student = require('./Student');
const Faculty = require('./Faculty');
const Class = require('./Class');

// Define associations
Student.belongsTo(Faculty, { foreignKey: 'faculty_id' });
Student.belongsTo(Class, { foreignKey: 'class_id' });

Faculty.hasMany(Student, { foreignKey: 'faculty_id' });
Class.hasMany(Student, { foreignKey: 'class_id' });

Class.belongsTo(Faculty, { foreignKey: 'faculty_id' });
Faculty.hasMany(Class, { foreignKey: 'faculty_id' });

module.exports = {
  Student,
  Faculty,
  Class
}; 