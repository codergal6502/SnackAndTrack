
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace SnackAndTrack.DatabaseAccess.Entities {
    public class AmountMade { 
        [Key]
        public virtual required Guid Id { get; set; }
        public virtual required Unit Unit { get; set; }
        public virtual required Single Quantity { get; set; }
        public virtual required Int16 DisplayOrder { get; set; }
        public virtual required Recipe Recipe { get; set; }
    }
}