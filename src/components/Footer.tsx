
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="p-8 border-t border-border mt-auto bg-card">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        
        {/* Identificare PFA */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</p>
          <p>CUI: 52564061 | Nr. Reg. Com.: F2025036030001</p>
        </div>

        {/* Linkuri Legale */}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-medium">
          <Link to="/termeni-si-conditii" className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
            Termeni și Condiții
          </Link>
          <span className="text-border">|</span>
          <Link to="/politica-de-confidentialitate" className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
            Politică de Confidențialitate
          </Link>
          <span className="text-border">|</span>
          <Link to="/politica-cookies" className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
            Politică Cookies
          </Link>
        </div>

        {/* Pictograme ANPC */}
        <div className="flex flex-wrap justify-center gap-4 py-2">
          <a 
            href="https://anpc.ro/ce-este-sal/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="https://anpc.ro/wp-content/uploads/2022/07/SAL-PICTOGRAMA.png" 
              alt="Soluționarea Alternativă a Litigiilor" 
              className="h-[50px] w-auto object-contain"
            />
          </a>
          <a 
            href="https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home2.show&lng=RO" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="https://anpc.ro/wp-content/uploads/2022/08/pictogramaSOL.png" 
              alt="Soluționarea Online a Litigiilor" 
              className="h-[50px] w-auto object-contain"
            />
          </a>
        </div>

        {/* Semnătură și Contact */}
        <div className="text-center text-[10px] sm:text-xs text-muted-foreground/60">
          <p>Construit și proiectat de <span className="text-foreground font-medium">Francesco Maxim</span> | <a href="tel:+40758990675" className="hover:text-primary">+40758990675</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
