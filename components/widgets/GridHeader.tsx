import React from 'react'

interface GridHeaderProps{
    children:string
}

const GridHeader = ({children}:GridHeaderProps) => {
  return (
    <div className="text-center py-2">
    <h2 className='text-xm font-medium uppercase tracking-wide text-foreground'>
      {children}
    </h2>
    </div>
  )
}

export default GridHeader;
