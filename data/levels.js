const levels = [
  'Junior',
  'Mid',
  'Senior',
  'Lead'
]

const sortedLevels = levels.sort()
const levelObjArr = []

sortedLevels.map((level) => {
  levelObjArr.push({
    name: level,
    status: 1,
  })
})

console.log(levelObjArr)

module.exports = levelObjArr