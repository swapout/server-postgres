const knex = require('../config/db')

exports.insertTechnologies = (technologies) => {
  knex.batchInsert('technology', technologies)
    .then(function() {
      console.log('all went well')})
    .catch(function(error) {
      console.log(error.message)
    });
}

exports.insertLanguages = (languages) => {
  knex.batchInsert('language', languages)
    .then(function() {
      console.log('Languages were added!')})
    .catch(function(error) {
      console.log(error.message)
    });
}


