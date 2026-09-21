function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) { 
  const s = { sm: 28, md: 36, lg: 44 }[size] 
  const txt = { sm: 'text-base', md: 'text-lg', lg: 'text-3xl' }[size] 

  return ( 
    <div className="flex items-center gap-2.5"> 
      <div 
        style={{ 
          width: s, 
          height: s, 
          background: '#fcfcfc', 
          borderRadius: 10, 
        }} 
        className="flex items-center justify-center shrink-0"
      > 
        <div  
        >
          
          <img 
            src="/icon.ico" 
            alt="Ícone" 
            style={{ 
              width: '800%',  
              height: '80%', 
              objectFit: 'contain' 
            }} 
          />
        </div>
      </div> 

      <span 
        className={`font-display font-700 tracking-tight text-gray-700 ${txt}`} 
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }} 
      > 
        Hospital da Visão 
      </span> 
    </div> 
  ) 
} 

export default Logo
