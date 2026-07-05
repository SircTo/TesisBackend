'use strict';

/**
 * Restringe el acceso a una ruta según el rol del usuario autenticado.
 * Debe usarse DESPUÉS de authenticate (necesita req.user).
 *
 * Ejemplo de uso:
 *   router.post('/zonas', authenticate, authorize('administrador'), crearZona);
 *
 * @param {...string} rolesPermitidos  Roles que pueden acceder (ej: 'administrador', 'garzon', 'jefe_cocina')
 */
function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
    }
    return next();
  };
}

module.exports = { authorize };
