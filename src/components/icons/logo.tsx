import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <path
        fill="currentColor"
        d="M208,88H152V32a8,8,0,0,0-16,0V88H88V32a8,8,0,0,0-16,0V88H16a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8H72v48a8,8,0,0,0,16,0V152h48v48a8,8,0,0,0,16,0V152h64a8,8,0,0,0,8-8V96A8,8,0,0,0,208,88ZM152,136H88V104h64Zm48,0H168V104h32Z"
      />
    </svg>
  );
}
