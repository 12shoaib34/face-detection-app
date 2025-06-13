import FaceDetection from './components/FaceDetection'
import FaceDetectionSimple from './components/FaceDetectionSimple'
import FaceDetectionOptimized from './components/FaceDetectionOptimized'
import './App.css'

function App() {
  return (
    <div className="App">
      {/* <FaceDetection /> */}
      <FaceDetectionOptimized />
      {/* <FaceDetectionSimple /> */}
    </div>
  )
}

export default App
