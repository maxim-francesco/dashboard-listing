import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="p-8 border-t border-border mt-auto bg-card">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
        
        {/* Identificare PFA */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1 uppercase tracking-wider">MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</p>
          <p>CUI: 52564061 | Nr. Reg. Com.: F2025036030001</p>
        </div>

        {/* Linkuri Legale */}
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium">
          <Link to="/termeni-si-conditii" className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
            Termeni și Condiții
          </Link>
          <Link to="/politica-de-confidentialitate" className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
            Politică de Confidențialitate
          </Link>
          <Link to="/politica-cookies" className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
            Politică Cookies
          </Link>
        </div>

        {/* Pictograme ANPC */}
        <div className="flex flex-wrap justify-center items-center gap-6 py-2">
          <a 
            href="https://anpc.ro/ce-este-sal/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity grayscale hover:grayscale-0"
          >
            <img 
              src="https://anpc.ro/wp-content/uploads/2022/07/SAL-PICTOGRAMA.png" 
              alt="Soluționarea Alternativă a Litigiilor" 
              className="h-[45px] w-auto object-contain"
            />
          </a>
          <a 
            href="https://ec.europa.eu/consumers/odr/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity grayscale hover:grayscale-0"
          >
            <img 
              src="https://anpc.ro/wp-content/uploads/2022/08/pictogramaSOL.png" 
              alt="Soluționarea Online a Litigiilor" 
              className="h-[45px] w-auto object-contain"
            />
          </a>
        </div>

        {/* Semnătură și Contact */}
        <div className="text-center pt-4 border-t border-border/50 w-full max-w-md">
          <p className="text-[11px] sm:text-xs text-muted-foreground font-light tracking-wide italic">
            Construit și proiectat de <span className="text-foreground font-semibold not-italic">Francesco Maxim</span> | <a href="tel:+40758990675" className="hover:text-primary transition-colors font-medium">+40758990675</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
