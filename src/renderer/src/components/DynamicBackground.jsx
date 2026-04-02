/**
 * DynamicBackground.jsx — 極度純淨背景 (UI V4.0 Final)
 */
function DynamicBackground() {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#000000] pointer-events-none overflow-hidden">
      {/* 頂部極細緻柔白反光 */}
      <div 
        className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-full h-full opacity-30 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}

export default DynamicBackground
